// ==UserScript==
// @name         b站视频解析
// @namespace    https://github.com/liuguangw
// @version      0.1
// @description  解析B站视频地址
// @updateURL    https://raw.githubusercontent.com/liuguangw/tampermonkey_code/master/bilibili.js
// @author       liuguang
// @match        *://*.bilibili.com/*
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
    height: 500px;
    position: absolute;
    left: 30px;
    top: 87px;
    overflow-y: auto;
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
    color: #212121;
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

    function showMediaDialog(videoList, audioList) {
        //
        console.log(videoList);
        console.log(audioList);
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
        videoTitleEl.innerText = "视频列表";
        dialogEl.appendChild(videoTitleEl);
        let videoContainerEl = document.createElement("div");
        videoContainerEl.className = "video-container";
        for (let i = 0; i < videoList.length; i++) {
            let videoInfo = videoList[i];
            let linkEl = document.createElement("a");
            linkEl.className = "video-node";
            linkEl.target = "_blank";
            linkEl.href = videoInfo.base_url;
            linkEl.innerText = "type :" + videoInfo.mime_type + "[" + videoInfo.width + "x" + videoInfo.height + "]";
            videoContainerEl.appendChild(linkEl);
        }
        dialogEl.appendChild(videoContainerEl);
        //音频列表
        let audioTitleEl = document.createElement("div");
        audioTitleEl.className = "sub-title";
        audioTitleEl.innerText = "音频列表";
        dialogEl.appendChild(audioTitleEl);
        let audioContainerEl = document.createElement("div");
        audioContainerEl.className = "audio-container";
        for (let i = 0; i < audioList.length; i++) {
            let audioInfo = audioList[i];
            let linkEl = document.createElement("a");
            linkEl.className = "audio-node";
            linkEl.target = "_blank";
            linkEl.href = audioInfo.base_url;
            linkEl.innerText = "type :" + audioInfo.mime_type;
            audioContainerEl.appendChild(linkEl);
        }
        dialogEl.appendChild(audioContainerEl);
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
        showMediaDialog(mediaInfo.result.dash.video, mediaInfo.result.dash.audio);
    }

    addXMLRequestCallback(function (xhr) {
        xhr.addEventListener("load", function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (xhr.responseURL.indexOf('/pgc/player/web/playurl') !== -1) {
                    onMediaInfoLoaded(xhr.response);
                }
            }
        });
    });

})();