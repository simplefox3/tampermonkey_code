// ==UserScript==
// @name         腾讯视频解析
// @namespace    https://github.com/liuguangw
// @version      0.1
// @description  解析腾讯视频地址
// @updateURL    https://raw.githubusercontent.com/liuguangw/tampermonkey_code/master/vqq.js
// @author       liuguang
// @match        *://v.qq.com/*
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
.modal-main a.video-node,
 .modal-main a.audio-node {
    display: block;
    font-size: 16px;
    line-height: 1.3;
    color: #fbdce4;
}
.modal-main a.video-node:hover,
 .modal-main a.audio-node:hover{
color: #00a1d6;
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
        //
        let fiList = vinfo.fl.fi;
        let vi = vinfo.vl.vi[0];
        let m3u8UrlList = vi.ul.ui;
        console.log(fiList);
        console.log(vi);
        console.log(m3u8UrlList);
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
        videoTitleEl.innerText = vi.ti+" - 视频列表";
        dialogEl.appendChild(videoTitleEl);
        let videoContainerEl = document.createElement("div");
        videoContainerEl.className = "video-container";
        for (let i = 0; i < m3u8UrlList.length; i++) {
            let linkEl = document.createElement("a");
            linkEl.className = "video-node";
            linkEl.target = "_blank";
            linkEl.href = m3u8UrlList[i].url;
            linkEl.innerText = "source #" + i;
            videoContainerEl.appendChild(linkEl);
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
        if("vinfo" in mediaInfo){
            let vinfoStr = mediaInfo.vinfo;
            let vinfo = JSON.parse(vinfoStr);
            console.log(vinfo);
            showMediaDialog(vinfo);
        }
    }

    addXMLRequestCallback(function (xhr) {
        xhr.addEventListener("load", function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.responseURL.indexOf('/proxyhttp') !== -1) {
                    onMediaInfoLoaded(xhr.response);
                }
            }
        });
    });

})();
