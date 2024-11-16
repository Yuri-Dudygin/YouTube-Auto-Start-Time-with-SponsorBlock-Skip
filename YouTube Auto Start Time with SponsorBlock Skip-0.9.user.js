// ==UserScript==
// @name         YouTube Auto Start Time with SponsorBlock Skip and Channels
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Автоматическое начало воспроизведения видео на YouTube с пропуском спонсорских сегментов SponsorBlock и сохранением времени начала для каналов
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const targetTime = 90; // Время по умолчанию, с которого начинается видео
    const MinimumVideoLength = 420;
    const maxRetries = 5;
    const retryDelay = 1000;
    const channelsKey = 'Channels';

    let lastProcessedVideoId = null;

    function getChannels() {
        const list = localStorage.getItem(channelsKey);
        return list ? JSON.parse(list) : [];
    }

    function saveChannels(channels) {
        localStorage.setItem(channelsKey, JSON.stringify(channels));
    }

    function addToChannels(channelId, start) {
        const channels = getChannels();
        const existingChannel = channels.find(channel => channel.id === channelId);
        if (existingChannel) {
            existingChannel.start = start;
            saveChannels(channels);
            displayMessage(`Время начала для канала обновлено: ${channelId}, новое время: ${start} секунд`);
        } else {
            channels.push({ id: channelId, start: start });
            saveChannels(channels);
            displayMessage(`Канал добавлен в список: ${channelId}, начало с ${start} секунд`);
        }
        updateButtons(channelId);
    }

    function removeFromChannels(channelId) {
        let channels = getChannels();
        channels = channels.filter(channel => channel.id !== channelId);
        saveChannels(channels);
        displayMessage(`Канал удалён из списка: ${channelId}`);
        updateButtons(channelId);
    }

    function displayMessage(message) {
        const messageBox = document.createElement('div');
        messageBox.style.position = 'fixed';
        messageBox.style.bottom = '20px';
        messageBox.style.left = '20px';
        messageBox.style.padding = '10px 20px';
        messageBox.style.backgroundColor = '#ffcccc';
        messageBox.style.border = '1px solid #ff0000';
        messageBox.style.color = '#000';
        messageBox.style.fontSize = '16px';
        messageBox.style.zIndex = '10000';
        messageBox.style.borderRadius = '5px';
        messageBox.innerText = message;

        document.body.appendChild(messageBox);

        setTimeout(() => {
            messageBox.remove();
        }, 5000);
    }

    function addButton(channelId, video) {
        const addButton = document.createElement('button');
        const removeButton = document.createElement('button');

        addButton.innerText = '+';
        addButton.style.position = 'fixed';
        addButton.style.top = '100px';
        addButton.style.left = '20px';
        addButton.style.padding = '5px 10px';
        addButton.style.backgroundColor = '#A9A9A9';
        addButton.style.color = 'white';
        addButton.style.border = 'none';
        addButton.style.borderRadius = '50%';
        addButton.style.width = '40px';
        addButton.style.height = '40px';
        addButton.style.fontSize = '20px';
        addButton.style.cursor = 'pointer';
        addButton.style.zIndex = '10000';
        addButton.onclick = () => addToChannels(channelId, Math.floor(video.currentTime));

        removeButton.innerText = '-';
        removeButton.style.position = 'fixed';
        removeButton.style.top = '140px';
        removeButton.style.left = '20px';
        removeButton.style.padding = '5px 10px';
        const channels = getChannels();
        let color = '#A9A9A9';
        if (channels.some(channel => channel.id === channelId)) {
            color = '#d69083';
        }
        removeButton.style.backgroundColor = color;
        removeButton.style.color = 'white';
        removeButton.style.border = 'none';
        removeButton.style.borderRadius = '50%';
        removeButton.style.width = '40px';
        removeButton.style.height = '40px';
        removeButton.style.fontSize = '20px';
        removeButton.style.cursor = 'pointer';
        removeButton.style.zIndex = '10000';
        removeButton.onclick = () => removeFromChannels(channelId);

        document.body.appendChild(addButton);
        document.body.appendChild(removeButton);
    }

    function updateButtons(channelId) {
        const channels = getChannels();
        const removeButton = document.querySelector('button[innerText="-"]');
        if (removeButton) {
            if (channels.some(channel => channel.id === channelId)) {
                removeButton.style.backgroundColor = '#FF0000';
            } else {
                removeButton.style.backgroundColor = '#A9A9A9';
            }
        }
    }

    async function setStartTime(attempt = 0) {
        const video = document.querySelector('video');
        if (!video) {
            console.error('Видео не найдено на странице');
            return;
        }

        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) {
            console.error('Не удалось определить ID видео');
            return;
        }

        if (lastProcessedVideoId === videoId) {
            console.log('Это видео уже обработано, пропускаем.');
            return;
        }

        const channelId = document.querySelector('ytd-video-owner-renderer a')?.href.split('/').pop();
        if (!channelId) {
            console.error('Не удалось определить ID канала');
            return;
        }

        lastProcessedVideoId = videoId;

        const channels = getChannels();
        const channel = channels.find(channel => channel.id === channelId);

        addButton(channelId, video);

        if (!video.duration || video.duration < MinimumVideoLength) {
            console.log('Длина видео меньше минимальной, перемотка не требуется.');
            return;
        }

        const targetStartTime = channel ? channel.start : targetTime;

        // Проверяем, не воспроизводится ли видео с текущего времени, превышающего целевое
        if (video.currentTime >= targetStartTime) {
            console.log('YouTube уже начал воспроизведение с нужного времени или позже, перемотка не требуется.');
            return;
        }

        const interval = setInterval(() => {
            if (video.readyState >= 2) {
                video.currentTime = targetStartTime;
                console.log(`Перемотка на ${targetStartTime} секунд`);
                clearInterval(interval);
            } else if (attempt >= maxRetries) {
                console.error('Не удалось перемотать видео после нескольких попыток');
                clearInterval(interval);
            }
            attempt++;
        }, retryDelay);
    }

    window.addEventListener('load', () => {
        setTimeout(setStartTime, 2000);
    });

    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(setStartTime, 2000);
    });

})();
