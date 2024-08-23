// ==UserScript==
// @name         YouTube Auto Start Time with SponsorBlock Skip
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Автоматическое начало воспроизведения видео на YouTube с определенного времени с пропуском спонсорских сегментов SponsorBlock
// @author       Вы
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const targetTime = 90; // Установите время начала (в секундах)

    // Функция для получения данных от SponsorBlock API
    async function fetchSponsorBlockSegments(videoId) {
        const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&category=sponsor`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    return data;
                } else {
                    console.error('Неверный формат данных:', data);
                }
            } else {
                console.error('Ошибка HTTP:', response.status);
            }
        } catch (error) {
            console.error('Ошибка при получении данных от SponsorBlock:', error);
        }
        return [];
    }

    // Функция для проверки, попадает ли время в спонсорский сегмент
    function getSkipTime(segments, time) {
        // Найти последний сегмент, который охватывает целевое время
        let skipTime = null;
        for (const segment of segments) {
            if (time >= segment.segment[0] && time <= segment.segment[1]) {
                // Перемотка в конец спонсорского сегмента
                skipTime = segment.segment[1];
            }
        }
        return skipTime;
    }

    // Основная функция для установки времени начала
    async function setStartTime() {
        const video = document.querySelector('video');
        if (!video) return;

        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) return;

        const segments = await fetchSponsorBlockSegments(videoId);
        const skipTime = getSkipTime(segments, targetTime);

        // Перематываем видео
        if (video.currentTime < targetTime) {
            if (skipTime !== null) {
                video.currentTime = skipTime;
            } else {
                video.currentTime = targetTime;
            }
        }
    }

    // Запуск при загрузке страницы и смене видео
    window.addEventListener('yt-navigate-finish', setStartTime);
    window.addEventListener('load', setStartTime);
})();
