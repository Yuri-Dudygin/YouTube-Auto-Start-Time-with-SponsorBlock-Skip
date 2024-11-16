<details>
<summary>ru</summary>
# Автопереход на заданное время YouTube с настройками для каналов

Этот скрипт для Tampermonkey добавляет возможность автоматического перехода к заданному времени воспроизведения на YouTube с учетом настроек для отдельных каналов:

- **Индивидуальные точки начала**: Сохраняйте время начала для конкретного канала, нажав на кнопку `+`, или сбрасывайте настройки с помощью кнопки `-`.
- **Стандартное время начала**: Если для канала не задано индивидуальное время, видео начинается с значения `targetTime`.
- **Учет логики воспроизведения**: Скрипт не вмешивается, если YouTube автоматически возобновляет воспроизведение с места остановки, или если длина видео меньше `MinimumVideoLength`.

## Установка

1. Установите [Tampermonkey](https://www.tampermonkey.net/).
2. Добавьте и активируйте этот скрипт.
3. Используйте кнопки на страницах видео для управления настройками начала для каналов.

## Возможности

- Перематывает видео на сохраненное время для конкретных каналов.
- Использует стандартное время (`targetTime`), если настройки для канала отсутствуют.
- Совместим с функцией автопроигрывания YouTube и SponsorBlock.

Вы можете настроить параметры, такие как `targetTime` и `MinimumVideoLength`, прямо в коде скрипта.
</details>

# YouTube Auto Start Time with Channel-Specific Start Points

This Tampermonkey script enhances YouTube by automatically setting the start time of videos based on predefined rules:

- **Custom Start Times**: Save a specific start time for each channel by clicking the `+` button, or reset it with the `-` button.
- **Target Time**: If no custom time is set for a channel, videos start at the default `targetTime`.
- **Playback Logic**: The script avoids interfering if YouTube resumes playback from a previously stopped point or if the video is shorter than the defined `MinimumVideoLength`.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Add this script and activate it.
3. Use the buttons on video pages to manage start times for channels.

## Features

- Skips to a saved start time for specific channels.
- Defaults to `targetTime` for unsaved channels.
- Works with YouTube's built-in resume feature and SponsorBlock.

Adjust parameters like `targetTime` and `MinimumVideoLength` directly in the script to fit your needs.
