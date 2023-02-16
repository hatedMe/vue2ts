
<script lang="ts">
    import * as Api from "@/http/api.js";
import { Component, Mixins, Prop, Prop, Watch } from "vue-property-decorator";
@Component({
  components: {
    test1,
    test2,
    test3
  }
})
export default class Test extends Mixins(baseMin,baseMin2) {
  @Prop() readonly name!: string: any | undefined;
  public var1: number = 1;
  public var2: string = "hello world";
  @Prop() readonly size:  any | undefined;
  @Prop() readonly message:  any | undefined;
  @Prop({ type : Number }) readonly props1: number;
  @Prop([Number , String]) readonly props2: number | string;
  @Prop({ default: 'defaultValue' }) readonly props3: string;
  @Prop({
    type: [Number, String]
  })
  readonly props4: number | string;
  @Prop({
    type: [Number, String]
  })
  readonly props4: number | string;
  @Prop({
    type: Number,
    default: 0,
    required: true,
    validator: function (value) {
      return value >= 0;
    }
  })
  readonly props1: number;
  @Prop({
    type: Number,
    default: 0,
    required: true,
    validator: function (value) {
      return value >= 0;
    }
  })
  readonly props1: number;
  get computedVal1() {
    return true;
  }
  get computedVal2() {
    return true;
  }
  get computedVal3() {
    return true;
  }
  set computedVal3() {
    console.log(v);
  }
  async onLaunch (opt) {
    this.autoUpdate(); // 自动更新
    this.$refs.xxx;
    // 获取机型等相关信息
    wx.getSystemInfo({
      success: res => {
        const modelmes = res.model;
        if (modelmes.search("iPhone X") !== -1 || modelmes.search("iPhone 11") !== -1) {
          // this.$store.dispatch("getPhoneModel", true);
        }
      }
    });
  }
  async mounted (opt) {
    console.log(this.$root.$mp, opt);
    console.log("app enter 入场参数--------------", opt.query);
    const {
      path: url,
      query
    } = opt;
    const {
      channel_id
    } = query;
    console.log("url ,channel_id : ", url);
    // 此段代码是统计
    wx.reportAnalytics("channel_id_conut", {
      channel_id,
      url
    });
    const serialNumber = wx.getStorageSync("serialNumber");
    this.$store.commit("getUserPhone", serialNumber);
    const res = await Api.iniConfig();
    if (res.statusCode === 9999) {
      return wx.showModal({
        title: "温馨提示",
        content: res.data,
        showCancel: false,
        // 隐藏取消按钮
        success: function (res) {
          if (res.confirm) {
            // 再次调用下载，并重启
            wx.exitMiniProgram();
          } else if (res.cancel) {
            wx.exitMiniProgram();
          }
        }
      });
    }
  }
  created () {
    console.log("app created");
  }
  async autoUpdate () {
    // 小程序自动更新
    const This = this;
    console.info("APP_BUILD_TIMER--------->", process.env.APP_BUILD_TIMER);
    if (!wx.canIUse("getUpdateManager")) {
      // 增加用户体验，给出友好提示
      return wx.showModal({
        title: "提示",
        content: "当前微信版本过低，无法使用该功能，请升级后重试。"
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
              showCancel: false,
              // 隐藏取消按钮
              confirmText: "确定更新",
              success: function (res) {
                if (res.confirm) {
                  // 再次调用下载，并重启
                  This.downloadAndUpdate(updateManager);
                }
              }
            });
          }
        }
      });
    });
    return Promise.resolve("OK");
  }
  downloadAndUpdate (updateManager) {
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
        content: "请你删除当前小程序，进行升级哦"
      });
    });
  }
  @Wacth('watchData2')
  onWatchData2Change(newVal, oldVal) {}
  @Wacth('watchData3')
  onWatchData3Change(newVal, oldVal) {
    this.someMethod(newVal, oldVal);
  }
  @Wacth('watchData4')
  onSomeMethod0Change(newVal, oldVal) {
    this.someMethod(newVal, oldVal);
  }
  @Wacth('watchData4')
  onAnotherMethod1Change(newVal, oldVal) {
    this.anotherMethod(newVal, oldVal);
  }
  @Wacth('watchData7')
  onHandle10Change(newVal, oldVal) {
    this.handle1(newVal, oldVal);
  }
  @Wacth('watchData7')
  onHandle21Change(val, oldVal) {}
  @Wacth("watchData7", {
    immediate: true
  })
  onWatchData72Change(val, oldVal) {}
  @Wacth("watchData7", {
    deep: true,
    immediate: true
  })
  onWatchData73Change(val, oldVal) {
    /* ... */
    console.log(object);
  }
}
</script>

<style>
@import "./style/sprites.scss";
@import "./style/main.css";
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
