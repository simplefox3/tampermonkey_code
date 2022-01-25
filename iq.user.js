// ==UserScript==
// @name         iqiyi视频解析
// @namespace    https://github.com/liuguangw
// @version      0.1
// @description  iqiyi视频地址
// @author       liuguang
// @match        *://www.iqiyi.com/*
// @match        *://cache.video.iqiyi.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    function addXMLRequestCallback(callback) {
        let oldSend, i;
        if (XMLHttpRequest.callbacks) {
            // we've already overridden send() so just add the callback
            XMLHttpRequest.callbacks.push(callback);
        } else {
            // create a callback queue
            XMLHttpRequest.callbacks = [callback];
            // store the native send()
            oldSend = XMLHttpRequest.prototype.send;
            // override the native send()
            XMLHttpRequest.prototype.send = function () {
                // process the callback queue
                // the xhr instance is passed into each callback but seems pretty useless
                // you can't tell what its destination is or call abort() without an error
                // so only really good for logging that a request has happened
                // I could be wrong, I hope so...
                // EDIT: I suppose you could override the onreadystatechange handler though
                for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
                    XMLHttpRequest.callbacks[i](this);
                }
                // call the native send()
                oldSend.apply(this, arguments);
            }
        }
    }

    function insertCssStyle() {
        let cssContent = `.modal-main {
    width: 300px;
    height: 310px;
    position: absolute;
    left: 30px;
    top: 87px;
    overflow-y: auto;
    z-index: 1000;
    border: 1px solid #ccc;
    padding: 8px;
    box-sizing: border-box;
}
.modal-main>.sub-title {
    font-size: 18px;
    font-weight: bold;
    color: #f45a8d;
}
.modal-main .video-container textarea{
	height: 206px;
    width: 100%;
    background: #caeae6;
}
.modal-main .close-btn{
    position: relative;
    font-size: 12px;
    display: inline-block;
    text-align: center;
    padding: 8px 10px;
    line-height: 16px;
    background-color: #fb7299;
    color: #fff;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: 0 6px 10px 0 rgba(251,114,153,.4);
    margin-top: 5px;
}
.modal-main .close-btn:hover{
    background-color: #ff85ad;
}`;
        let styleEl = document.createElement("style");
        styleEl.type = "text/css";
        styleEl.innerHTML = cssContent;
        document.getElementsByTagName("head").item(0).appendChild(styleEl);
    }

    function createDialogEl() {
        insertCssStyle();
        let dialogEl = document.createElement("div");
        dialogEl.className = "modal-main";
        document.body.appendChild(dialogEl);
        return dialogEl;
    }

    function showMediaDialog(vinfo) {
        console.log(vinfo);
        let modalList = document.getElementsByClassName("modal-main");
        let dialogEl;
        if (modalList.length > 0) {
            dialogEl = modalList.item(0);
            dialogEl.innerHTML = "";
            dialogEl.style.display = "block";
        } else {
            dialogEl = createDialogEl()
        }
        //视频列表
        let videoTitleEl = document.createElement("div");
        videoTitleEl.className = "sub-title";
        videoTitleEl.innerText = vinfo.scrsz+" - 视频";
        dialogEl.appendChild(videoTitleEl);
        let videoContainerEl = document.createElement("div");
        videoContainerEl.className = "video-container";
        {
            let textEl = document.createElement("textarea");
            textEl.value = vinfo.m3u8;
            videoContainerEl.appendChild(textEl);
        }
        dialogEl.appendChild(videoContainerEl);
        //关闭按钮
        let closeEl = document.createElement("a");
        closeEl.className = "close-btn";
        closeEl.innerText = "关闭";
        closeEl.addEventListener("click", function () {
            dialogEl.style.display = "none";
        });
        dialogEl.appendChild(closeEl);
    }

    function onMediaInfoLoaded(jsonContent) {
        let mediaInfo = JSON.parse(jsonContent);
        if("data" in mediaInfo){
            let videoList = mediaInfo.data.program.video;
            console.log(videoList);
			let vinfo = null;
			for (let i = 0; i < videoList.length; i++) {
				if(videoList[i]._selected){
					vinfo = videoList[i];
					break;
				}
			}
            showMediaDialog(vinfo);
        }
    }

    addXMLRequestCallback(function (xhr) {
        xhr.addEventListener("load", function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.responseURL.indexOf('/dash') !== -1) {
                    onMediaInfoLoaded(xhr.response);
                }
            }
        });
    });

})();
