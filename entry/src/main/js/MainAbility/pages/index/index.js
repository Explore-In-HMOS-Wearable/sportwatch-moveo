import { getTime } from '../../utils/time';
import sensor from '@system.sensor';
import app from '@system.app';
import router from '@ohos.router';
import file from '@system.file';
import { P2pClient } from '../../wearengine/wearengine.js'
import { PHONE_APP_FINGERPRINT, PHONE_APP_PACKAGE_NAME } from '../../common/constants';

const messageClient = new P2pClient();

export default {
    data: {
        time: '',
        exercisesType: 'DCoach',
        activitySelected: false,
        exerciseList: [
            { name: 'Running', img: 'common/running.jpg' },
            { name: 'Swimming', img: 'common/running.jpg' },
            { name: 'Cycling', img: 'common/running.jpg' },
            { name: 'Walking', img: 'common/walking.jpg' },
            { name: 'Yoga', img: 'common/running.jpg' }
        ],
        heartRate: 0,
        distanceKm: '0.00',
        kcal: '0',
        pageNums: ['1', '2', '3', '4', '5'],
        dotIndex: 1,
        durationSeconds: 0,
        steps: 0,
        durationText: "0'0\"",
        durationInterval: null,
        showCountdownPage: false,
        countdownValue: 3,
        showReady: false,
        countdownInterval: null,
        showSettingsPage: false,
        infoItems: [
            {
                title: "Settings",
                description: ["All your settings are shared",
                    "between your hone & watch",
                    "apps. Use your phone to",
                    "update your settings."].join('\n')
            },
            {
                title: "Values",
                description: ["To change values (distance,",
                    "speed, etc.) during a session,",
                    "make a tap on your watch.",].join('\n')
            },
            {
                title: "Headphones",
                description: ["To hear the vocal feedback,",
                    "pair your headphones directly",
                    "to you Watch."].join('\n')
            },
            {
                title: "Tips",
                description: ["To get more tips on the Watch",
                    "version, open Decat'",
                    "Coach on your phone and go",
                    "to Settings > Connectivity >",
                    "Watch"].join('\n')
            }
        ]
    },
    change(e) {
        this.dotIndex = e.index;
    },
    onInit() {
        messageClient.setPeerPkgName(PHONE_APP_PACKAGE_NAME);
        messageClient.setPeerFingerPrint(PHONE_APP_FINGERPRINT);
        this.registerMessage(); // wear engine register
        this.updateTime();
        setInterval(() => {
            this.updateTime();
        }, 60000);
    },
    onShow() {
        messageClient.setPeerPkgName(PHONE_APP_PACKAGE_NAME);
        messageClient.setPeerFingerPrint(PHONE_APP_FINGERPRINT);
    },
    registerMessage() {
        let that = this
        console.info('HWLOG registerMessage');

        messageClient.registerReceiver({
            onSuccess: function () {
                console.info('HWLOG Message register success')
            },
            onFailure: function () {
                console.info('HWLOG Message register fail')
            },
            onReceiveMessage: function (data)  {
                if (data && data.isFileType) {
                    console.info(`file: ${data.name}`)

                    that.readTextUri = data.name
                    that.readText()

                } else {
                    console.info(`message: ${data}`)
                }
            }
        });
    },

    readText() {
        file.readText({
            uri: this.readTextUri,
            success: (data) => {
                console.info(`Text read:${data.text}`)

                let lines = data.text.split('\n')

                lines.forEach(line => {
                    let parts = line.split(':')
                    if (parts.length === 2) {

                        let key = parts[0].trim()
                        let value = parseFloat(parts[1].trim())

                        console.info(`${key}->${value}`)

                        if (key === "Steps") {
                            this.steps = Math.floor(value)
                        }

                        if (key === "Calories") {
                            this.kcal = value.toFixed(2)
                        }

                        if (key === "Distance") {
                            // meter to kilometer convertion
                            this.distanceKm = (value / 1000).toFixed(2)
                        }

                        if (key === "HeartRate") {
                            this.heartRate = Math.floor(value)
                        }
                    }
                })
            },
            fail: (data, code) => {
                console.error(`readText fail: ${data}, ${code}`)
            }
        });
    },
    updateTime() {
        this.time = getTime();
    },
    swipeEvent(e) {
        if (e.direction === 'right') {
            if (this.activitySelected && this.dotIndex === 0) {
                this.activitySelected = false;
            } else {
                app.terminate();
            }
        }
    },
    handleSwipe(e) {
        if (e.direction === 'right' && this.dotIndex === 0) {
            this.activitySelected = false;
        }
    },
    backToInitPage() {
        if (this.activitySelected) {
            this.activitySelected = false;
            if (this.durationInterval) {
                clearInterval(this.durationInterval);
                this.durationInterval = null;
            }
        } else {
            router.back();
        }
    },
    selectExercise(exercise) {
        this.exercisesType = exercise;
        this.activitySelected = false;
        this.showCountdownPage = true;
        this.index = 1;
        this.showReady = false;
        this.countdownValue = 3;
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.countdownInterval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue === 0) {
                clearInterval(this.countdownInterval);
                this.showCountdownPage = false;
                this.showReady = true;
                setTimeout(() => {
                    this.showReady = false;
                    this.startExercise();
                }, 1000);
            }
        }, 1000);
    },
    startExercise() {
        this.activitySelected = true;
        this.durationSeconds = 0;
        this.durationText = "0'0\"";
        this.steps = 0;
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
        }
        this.durationInterval = setInterval(() => {
            this.durationSeconds++;
            this.updateDurationText();
        }, 1000);
    },
    updateDurationText() {
        const hours = Math.floor(this.durationSeconds / 3600);
        const minutes = Math.floor((this.durationSeconds % 3600) / 60);
        const seconds = this.durationSeconds % 60;
        this.durationText = `${hours > 0 ? `${hours}'` : ``}${minutes}'${seconds}"`;
    },
    stopExercise() {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    },
    stopExerciseBtn() {
        this.stopExercise();
    },
    resetExercise() {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        this.durationSeconds = 0;
        this.durationText = "0'0\"";
        this.steps = 0;
        this.distanceKm = '0.00';
        this.heartRate = 0;
    },
    continueExercise() {
        if (!this.durationInterval) {
            this.durationInterval = setInterval(() => {
                this.durationSeconds++;
                this.updateDurationText();
            }, 1000);
        }
    },
    openSettingsPage() {
        this.showSettingsPage = true;
    },
    closeSettingsPage() {
        this.showSettingsPage = false;
    },
    handleSwipeAll(e) {
        if (e.direction === 'right') {
            if (this.showSettingsPage) {
                this.showSettingsPage = false;
                return;
            }
            if (this.activitySelected && this.dotIndex === 0) {
                this.activitySelected = false;
                this.stopExercise();
                return;
            }
            router.back();
        }
    }
}
