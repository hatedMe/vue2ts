## Vue 语法糖转换成 vue-ts 写法

是一个将 vue 语法糖转换成 vue-ts 写法的工具，对于代码洁癖的人可以适当的解放双手。

### 使用
```
npm i -g @obciid/vue2ts
vue2ts -i ./src/App.vue
```

### 示例

```vue {.line-numbers}
// 转换前
<script>
export default {
    name: "HelloWorld",
    props: {
        msg: String,
    },
};
</script>

// 转换后
<script lang="ts">
import { Component , Vue , Prop } from "vue-property-decorator";
@Component({})
export default class HelloWorld extends Vue {
    @Prop() msg: string;
  }
}
</script>
```

目前已经完成

-   watch
-   props
-   data
-   vue 生命周期、uni-app 生命周期、mpvue 生命周期
-   methods
-   computed
-   mixins
-   components
-   filters 未实现 手动装换
-   provide 未实现 手动装换
-   inject 未实现 手动装换
