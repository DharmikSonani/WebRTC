export const videoResolutions = {
    SD_360p: {
        mandatory: {
            minWidth: 640,
            minHeight: 360,
            minFrameRate: 15,
        },
    },
    HD_720p: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720,
            minFrameRate: 30,
        },
    },
    FHD_1080p: {
        mandatory: {
            minWidth: 1920,
            minHeight: 1080,
            minFrameRate: 30,
        },
    },
    QHD_1440p: {
        mandatory: {
            minWidth: 2560,
            minHeight: 1440,
            minFrameRate: 60,
        },
    },
    UHD_4K: {
        mandatory: {
            minWidth: 3840,
            minHeight: 2160,
            minFrameRate: 60,
        },
    },
    UHD_8K: {
        mandatory: {
            minWidth: 7680,
            minHeight: 4320,
            minFrameRate: 60,
        },
    },
};