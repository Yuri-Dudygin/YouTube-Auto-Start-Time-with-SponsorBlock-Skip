// ==UserScript==
// @name         YouTube Auto Start Time with Channel Settings and SponsorBlock Support
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Автоматическое начало воспроизведения видео на YouTube с учётом SponsorBlock и сохранением времени для каналов
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const targetTime = 90; // Время по умолчанию
    const MinimumVideoLength = 420; // Минимальная длина видео для перемотки
    const channelsKey = 'Channels'; // Ключ для хранения каналов
    const SponsorBlockAPI = 'https://sponsor.ajay.app/api/skipSegments'; // API SponsorBlock
    const debugWindowOpacity = 0.8; // Прозрачность окна лога (от 0 до 1)

    let lastProcessedVideoId = null; // Для предотвращения повторной обработки
    let messageCounter = 1; // Порядковый номер сообщения в логе

    // Проверяем, является ли текущая страница страницей с видео
    const isVideoPage = () => {
        const videoId = new URLSearchParams(window.location.search).get('v');
        return !!videoId;
    };

    // Создание окна отладки
    const createDebugWindow = () => {
        if (!isVideoPage()) return;

        const container = document.createElement('div');
        container.id = 'debugContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '300px'; // Уменьшен размер окна
        container.style.height = '150px'; // Уменьшен размер окна
        container.style.zIndex = '10000';
        container.style.backgroundColor = `rgba(51, 51, 51, ${debugWindowOpacity})`;
        container.style.border = '1px solid #aaa';
        container.style.borderRadius = '5px';
        container.style.padding = '10px';
        container.style.fontSize = '10px'; // Уменьшен размер шрифта

        // Кнопка копирования лога
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Debug Log';
        copyButton.style.position = 'absolute';
        copyButton.style.top = '-30px';
        copyButton.style.right = '0';
        copyButton.style.padding = '5px 10px';
        copyButton.style.cursor = 'pointer';
        copyButton.style.backgroundColor = 'rgba(169, 169, 169, 0.6)'; // Полупрозрачный серый
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '5px';

        copyButton.onclick = () => {
            const debugWindow = document.getElementById('debugWindow');
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = debugWindow.textContent;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);
            alert('Debug log copied to clipboard!');
        };

        // Окно лога
        const debugWindow = document.createElement('textarea');
        debugWindow.id = 'debugWindow';
        debugWindow.style.width = '100%';
        debugWindow.style.height = '100%';
        debugWindow.style.backgroundColor = 'transparent';
        debugWindow.style.color = '#fff';
        debugWindow.style.border = 'none';
        debugWindow.style.borderRadius = '5px';
        debugWindow.style.overflowY = 'scroll';
        debugWindow.readOnly = true;

        container.appendChild(copyButton);
        container.appendChild(debugWindow);

        document.body.appendChild(container);
    };

    // Лог отладки с порядковым номером сообщения
    const logDebug = (message) => {
        const debugWindow = document.getElementById('debugWindow');
        if (debugWindow) {
            // Вставляем новое сообщение в начало, чтобы оно отображалось сверху
            debugWindow.textContent = `[${messageCounter++}] ${message}\n` + debugWindow.textContent;
        } else {
            console.log(`[${messageCounter++}] ${message}`);
        }
    };

    // Установка времени начала воспроизведения
    const setStartTime = async () => {
        if (!isVideoPage()) return;

        const video = document.querySelector('video');
        if (!video) return;

        const videoId = new URLSearchParams(window.location.search).get('v');
        const channelId = document.querySelector('ytd-video-owner-renderer a')?.href.split('/').pop();

        if (!videoId || !channelId) return;
        if (videoId === lastProcessedVideoId) {
            logDebug('[Пропуск] Видео уже обработано');
            return;
        }

        lastProcessedVideoId = videoId;

        const channels = getChannels();
        const channel = channels.find(c => c.id === channelId);
        const startTime = channel ? channel.start : targetTime;

        if (!video.duration || video.duration < MinimumVideoLength) {
            logDebug('[Пропуск] Видео слишком короткое для перемотки');
            return;
        }

        logDebug(`[Установка времени начала] Канал: ${channelId}, Видео: ${videoId}`);
        await seekToStartTime(video, startTime, videoId);
    };

    // Логика перемотки видео
    const seekToStartTime = async (video, startTime, videoId) => {
        const adjustedTime = await adjustForSponsorBlock(startTime, videoId);
        if (Math.abs(video.currentTime - adjustedTime) > 1) {
            video.currentTime = adjustedTime;
            logDebug(`[Перемотка] Видео на ${adjustedTime} секунд`);
        } else {
            logDebug(`[Перемотка не требуется] Текущая точка: ${video.currentTime}`);
        }
    };

    // Корректировка времени с учётом SponsorBlock
    const adjustForSponsorBlock = async (startTime, videoId) => {
        try {
            const response = await fetch(`${SponsorBlockAPI}?videoID=${videoId}`);
            const data = await response.json();
            const sponsorSegments = data.filter(segment => segment.category.includes('sponsor'));
            for (const segment of sponsorSegments) {
                const [start, end] = segment.segment;
                if (startTime >= start && startTime <= end) {
                    logDebug(`[SponsorBlock] Время ${startTime} попало в интервал ${start}-${end}. Перемотка на ${end}`);
                    return end;
                }
            }
        } catch (error) {
            logDebug(`[Ошибка SponsorBlock] ${error.message}`);
        }
        return startTime;
    };

    // Получить список каналов из локального хранилища
    const getChannels = () => JSON.parse(localStorage.getItem(channelsKey) || '[]');

    // Добавление кнопок управления
    const addControlButtons = (channelId) => {
        if (!isVideoPage()) return;

        const addButton = document.createElement('button');
        const removeButton = document.createElement('button');
        const existingChannel = getChannels().some(c => c.id === channelId);

        addButton.textContent = '+';
        removeButton.textContent = '-';

        const styleButton = (btn, top) => {
            btn.style.position = 'fixed';
            btn.style.left = '20px';
            btn.style.top = `${top}px`;
            btn.style.zIndex = '10000';
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.borderRadius = '50%';
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = existingChannel ? '#d69083' : '#A9A9A9';
            btn.style.color = 'white';
        };

        styleButton(addButton, 100);
        styleButton(removeButton, 140);

        addButton.onclick = () => {
            const video = document.querySelector('video');
            if (video) addOrUpdateChannel(channelId, Math.floor(video.currentTime));
        };

        removeButton.onclick = () => removeChannel(channelId);

        document.body.appendChild(addButton);
        document.body.appendChild(removeButton);
    };

    // Инициализация скрипта
    const initializeScript = async () => {
        if (!isVideoPage()) return;

        createDebugWindow();

        const video = document.querySelector('video');
        const channelId = document.querySelector('ytd-video-owner-renderer a')?.href.split('/').pop();

        if (video && channelId) {
            await setStartTime();
            addControlButtons(channelId);
        }
    };

    // Слушатели событий
    window.addEventListener('yt-navigate-finish', () => setTimeout(initializeScript, 500));
    window.addEventListener('load', () => setTimeout(initializeScript, 500));
})();
