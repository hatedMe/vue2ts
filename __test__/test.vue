<script>
import * as Api from "@/http/api.js";
export default {
    name : "test",
    mixins: [baseMin, baseMin2],
    components: {
        test1,
        test2,
        test3,
    },
    props: ["size", "message"],
    props: {
        props1: Number,
        props2: [Number, String],
        props3: "defaultValue",
        props4: {
            type: [Number, String],
        },
        props1: {
            type: Number,
            default: 0,
            required: true,
            validator: function (value) {
                return value >= 0;
            },
        },
    },
    computed: {
        computedVal1() {
            return true;
        },
        computedVal2: function () {
            return true;
        },
        computedVal3: {
            get() {
                return true;
            },
            set: function (v) {
                console.log(v);
            },
        },
    },
    data() {
        return {
            // sadsad
            var1: 1, // 注释
            var2: "hello world",
        };
    },
    async onLaunch(opt) {
        this.autoUpdate(); // 自动更新
        this.$refs.xxx;
        // 获取机型等相关信息
        wx.getSystemInfo({
            success: (res) => {
                const modelmes = res.model;
                if (modelmes.search("iPhone X") !== -1 || modelmes.search("iPhone 11") !== -1) {
                    // this.$store.dispatch("getPhoneModel", true);
                }
            },
        });
    },
    async mounted(opt) {
        console.log(this.$root.$mp, opt);
        console.log("app enter 入场参数--------------", opt.query);
        const { path: url, query } = opt;
        const { channel_id } = query;
        console.log("url ,channel_id : ", url);
        // 此段代码是统计
        wx.reportAnalytics("channel_id_conut", {
            channel_id,
            url,
        });
        const serialNumber = wx.getStorageSync("serialNumber");
        this.$store.commit("getUserPhone", serialNumber);
        const res = await Api.iniConfig();
        if (res.statusCode === 9999) {
            return wx.showModal({
                title: "温馨提示",
                content: res.data,
                showCancel: false, // 隐藏取消按钮
                success: function (res) {
                    if (res.confirm) {
                        // 再次调用下载，并重启
                        wx.exitMiniProgram();
                    } else if (res.cancel) {
                        wx.exitMiniProgram();
                    }
                },
            });
        }
    },
    created() {
        console.log("app created");
    },
    methods: {
        async autoUpdate() {
            // 小程序自动更新
            const This = this;
            console.info("APP_BUILD_TIMER--------->", process.env.APP_BUILD_TIMER);
            if (!wx.canIUse("getUpdateManager")) {
                // 增加用户体验，给出友好提示
                return wx.showModal({
                    title: "提示",
                    content: "当前微信版本过低，无法使用该功能，请升级后重试。",
                });
            }

            const updateManager = wx.getUpdateManager();

            updateManager.onCheckForUpdate(function (res) {
                // 检查小程序是否有新版本发布
                if (!res.hasUpdate) return; // 请求完新版本的信息回调
                wx.showModal({
                    title: "更新提示",
                    content: "检查到新版本，是否下载新版本并重启小程序？",
                    success: function (res) {
                        if (res.confirm) {
                            return This.downloadAndUpdate(updateManager); // 下载
                        } else if (res.cancel) {
                            // 点击取消，做强制更新操作
                            return wx.showModal({
                                title: "温馨提示",
                                content: "必须强制更新哦，旧版本无法正常使用",
                                showCancel: false, // 隐藏取消按钮
                                confirmText: "确定更新",
                                success: function (res) {
                                    if (res.confirm) {
                                        // 再次调用下载，并重启
                                        This.downloadAndUpdate(updateManager);
                                    }
                                },
                            });
                        }
                    },
                });
            });
            return Promise.resolve("OK");
        },
        downloadAndUpdate(updateManager) {
            wx.showLoading();
            // 监听小程序有版本更新事件，客户端主动触发
            updateManager.onUpdateReady(function () {
                wx.hideLoading();
                // 新版本下载好，调用applyUpdate
                updateManager.applyUpdate();
            });

            // 监听小程序更新失败事件
            updateManager.onUpdateFailed(function () {
                wx.hideLoading();
                wx.showModal({
                    title: "已经有新版了哦",
                    content: "请你删除当前小程序，进行升级哦",
                });
            });
        },
    },
    watch: {
        watchData1: function (newVal, oldVal) {
            /* ... */
        },
        watchData2(newVal, oldVal) {
            /* ... */
        },
        watchData3: "someMethod",
        watchData4: ["someMethod", "anotherMethod"],
        watchData5: {
            handler: function (newVal, oldVal) {
                /* ... */
            },
            deep: true,
        },
        watchData6: {
            handler(newVal, oldVal) {
                /* ... */
            },
            deep: true,
            immediate: true,
        },
        watchData7: [
            "handle1",
            function handle2(val, oldVal) {
                /* ... */
            },
            {
                handler: function handle3(val, oldVal) {
                    /* ... */
                },
                immediate: true,
            },
            {
                handler(val, oldVal) {
                    /* ... */
                    console.log(object);
                },
                immediate: true,
                deep: true,
            },
        ],
    },
};
</script>

<style>
.container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 200rpx 0;
    box-sizing: border-box;
}

/* body {
    padding-bottom: env(safe-area-inset-bottom);
} */

/* this rule will be remove */

* {
    transition: width 2s;
    -moz-transition: width 2s;
    -webkit-transition: width 2s;
    -o-transition: width 2s;
}
</style>
