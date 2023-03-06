import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import fs from "fs";
import path from "path";
// 处理vue生命周期map
const lifecycleMap = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "activated",
    "deactivated",
    "beforeDestroy",
    "destroyed",
    "errorCaptured",
    "beforeRouteEnter",
    "beforeRouteUpdate",
    "beforeRouteLeave",
    // 额外处理 uni-app、 mpvue 等生命周期
    "onLoad",
    "onShow",
    "onReady",
    "onHide",
    "onUnload",
    "onLaunch",
    "onPullDownRefresh",
    "onReachBottom",
    "onShareAppMessage",
    "onPageScroll",
];

const babel2tsTypeMap = {
    StringLiteral: "string",
    NumericLiteral: "number",
    BooleanLiteral: "boolean",
    ArrayExpression: "Array<any>",
    FunctionExpression: "Function",
};

const vueProps2TsTypeMap = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Array: "Array<any>",
    Object: "any",
    Date: "any",
    Function: "Function",
    Symbol: "symbol",
    Undefined: "undefined",
};

const watchFnName = (str: String) => {
    str = str.replace(/[^\w]/g, "");
    return str.slice(0, 1).toLocaleUpperCase() + str.slice(1);
};

/**
 * @description: 首字母大写方法
 * @return {*}
 * @param {*} str
 */
function firstUpperCase(str: string) {
    return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export default function (input: string): string {
    const CWD = process.cwd();
    const filePath = path.join(CWD, input);

    const vueCode = fs.readFileSync(path.join(filePath), "utf-8");
    const mt2 = vueCode.match(/<script.*>([\s\S]*)<\/script>/);
    if (!mt2) {
        throw new Error("vue文件中没有找到script标签");
    }
    const code = mt2![1];
    if (!code) {
        throw new Error("vue文件中script标签中没有找到代码");
    }
    const ast = parse(code, {
        sourceType: "module",
        plugins: [
            "jsx",
            "typescript",
            "classProperties",
            "decorators-legacy",
            "dynamicImport",
            "objectRestSpread",
            "optionalChaining",
            "nullishCoalescingOperator",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "asyncGenerators",
            "functionBind",
            "functionSent",
            "numericSeparator",
            "optionalCatchBinding",
            "throwExpressions",
            "classPrivateProperties",
            "classPrivateMethods",
            "classProperties",
            "doExpressions",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "functionBind",
        ],
    });
    traverse(ast, {
        enter(path) {},

        // // 将普通导出变成class导出
        ExportDefaultDeclaration(path) {
            const node = path.node;
            const declaration = node?.declaration;
            if (
                node.type !== "ExportDefaultDeclaration" ||
                declaration.type !== "ObjectExpression"
            ) {
                return;
            }
            const properties = declaration.properties;
            const classProperties = [];
            const classMethods = [];

            const importSpecifierOpt = ["Component", "Vue"];
            // mixns
            const mixinsOpt = [];
            let componentsOpt = [];
            let className = "";

            properties.forEach((item) => {
                if (item.type === "ObjectProperty") {
                    // 处理props
                    if (item.key.name === "props") {
                        importSpecifierOpt.push("Prop");
                        // 处理 props 的数组
                        if (item.value.type === "ArrayExpression") {
                            const props = item.value.elements;
                            props.forEach((prop) => {
                                const { value } = prop;
                                const Node = t.classProperty(
                                    t.identifier(`@Prop() readonly ${value}`),
                                    null,
                                    t.typeAnnotation(
                                        t.genericTypeAnnotation(t.identifier(" any | undefined"))
                                    ),
                                    // [t.decorator(t.identifier("Prop() readonly "))],
                                    [],
                                    false,
                                    false
                                );

                                classMethods.push(t.cloneDeepWithoutLoc(Node));
                            });
                        }

                        // 处理 props 的对象
                        if (item.value.type === "ObjectExpression") {
                            const props = item.value.properties;
                            props.forEach((prop) => {
                                // 处理 props 的对象里面的类型变量 例如： a: Number ,
                                if (prop.value.type === "Identifier") {
                                    const Node = t.classProperty(
                                        t.identifier(
                                            `@Prop({ type : ${prop.value.name} }) readonly ${prop.key.name}`
                                        ),
                                        null,
                                        t.typeAnnotation(
                                            t.genericTypeAnnotation(
                                                t.identifier(vueProps2TsTypeMap[prop.value.name])
                                            )
                                        ),
                                        [],
                                        false,
                                        false
                                    );

                                    classMethods.push(t.cloneDeepWithoutLoc(Node));
                                }
                                //处理 props 的对象里面的类型变量 例如: a: [Number , String]
                                if (prop.value.type === "ArrayExpression") {
                                    const elements = prop.value.elements;
                                    const typeArrayStr = elements
                                        .map((item) => {
                                            return item.name;
                                        })
                                        .join(" , ");
                                    const Node = t.classProperty(
                                        t.identifier(
                                            `@Prop([${typeArrayStr}]) readonly ${prop.key.name}`
                                        ),
                                        null,
                                        t.typeAnnotation(
                                            t.genericTypeAnnotation(
                                                t.identifier(
                                                    prop.value.elements
                                                        .map((value) => {
                                                            return vueProps2TsTypeMap[value.name];
                                                        })
                                                        .join(" | ")
                                                )
                                            )
                                        ),
                                        [],
                                        false,
                                        false
                                    );

                                    classMethods.push(t.cloneDeepWithoutLoc(Node));
                                }
                                // 处理 props 的对象里面的类型变量 例如： a: 'defaultValue',
                                if (prop.value.type === "StringLiteral") {
                                    const Node = t.classProperty(
                                        t.identifier(
                                            `@Prop({ default: '${prop.value.value}' }) readonly ${prop.key.name}`
                                        ),
                                        null,
                                        t.typeAnnotation(
                                            t.genericTypeAnnotation(t.identifier("string"))
                                        ),
                                        [],
                                        false,
                                        false
                                    );
                                    classMethods.push(t.cloneDeepWithoutLoc(Node));
                                }
                                // 处理 props 的对象里面的类型变量 例如： a: { type: Number, default: 0 , required: true},
                                if (prop.value.type === "ObjectExpression") {
                                    const propItem = prop.value.properties;
                                    const typeItem = propItem.find(
                                        (item) => item.key.name === "type"
                                    );
                                    // console.log(typeItem.value.name);
                                    const typeArrayStr =
                                        typeItem.value.name ?? typeItem.value.name
                                            ? vueProps2TsTypeMap[typeItem.value.name]
                                            : typeItem.value.elements
                                                  .map((item) => {
                                                      return vueProps2TsTypeMap[item.name];
                                                  })
                                                  .join(" | ");
                                    const Node = t.classProperty(
                                        t.identifier(`readonly ${prop.key.name}`),
                                        null,
                                        t.typeAnnotation(
                                            t.genericTypeAnnotation(t.identifier(typeArrayStr))
                                        ),
                                        [
                                            t.decorator(
                                                t.callExpression(t.identifier("Prop"), [
                                                    t.objectExpression(
                                                        propItem.map((item) => {
                                                            return t.objectProperty(
                                                                t.identifier(item.key.name),
                                                                item.value
                                                            );
                                                        })
                                                    ),
                                                ])
                                            ),
                                        ],
                                        false,
                                        false
                                    );

                                    classMethods.push(t.cloneDeepWithoutLoc(Node));

                                    // const { properties } = prop.value;
                                    // const type = properties.find(
                                    //     (item) => item.key.name === "type"
                                    // );
                                    // const defaultVal = properties.find(
                                    //     (item) => item.key.name === "default"
                                    // );
                                    // const Node = t.classProperty(
                                    //     t.identifier(`@Prop() readonly ${prop.key.name}`),
                                    //     defaultVal
                                    //         ? t.cloneDeepWithoutLoc(defaultVal.value)
                                    //         : null,
                                    //     t.typeAnnotation(
                                    //         t.genericTypeAnnotation(
                                    //             t.identifier(
                                    //                 vueProps2TsTypeMap[type.value.name]
                                    //             )
                                    //         )
                                    //     ),
                                    //     [],
                                    //     false,
                                    //     false
                                    // );

                                    classMethods.push(t.cloneDeepWithoutLoc(Node));
                                }
                            });
                        }
                    }
                    // 处理 name 属性
                    if (item.key.name === "name") {
                        className = firstUpperCase(item.value.value);
                    }
                    // 处理methods
                    if (item.key.name === "methods") {
                        const methods = item.value.properties;
                        methods.forEach((method) => {
                            const {
                                async,
                                generator,
                                computed,
                                params,
                                body,
                                key: { name },
                            } = method;
                            classMethods.push(
                                t.classMethod(
                                    "method",
                                    t.identifier(name + " "),
                                    params,
                                    t.blockStatement(body.body),
                                    computed,
                                    false,
                                    generator,
                                    async
                                )
                            );
                        });
                    }
                    // 处理computed
                    if (item.key.name === "computed") {
                        const computed = item.value.properties;
                        computed.forEach((computedItme) => {
                            // 处理 computed 的es对象方法
                            if (computedItme.type === "ObjectMethod") {
                                const {
                                    async,
                                    generator,
                                    computed,
                                    params,
                                    body,
                                    key: { name },
                                } = computedItme;
                                const Node = t.classMethod(
                                    "method",
                                    t.identifier(`get ${name}`),
                                    params,
                                    t.blockStatement(body.body),
                                    computed,
                                    false,
                                    generator,
                                    async
                                );
                                classMethods.push(Node);
                            }
                            // 处理 computed 的 函数表达式
                            if (
                                computedItme.type === "ObjectProperty" &&
                                computedItme.value.type === "FunctionExpression"
                            ) {
                                const {
                                    key: { name },
                                    value: { body },
                                } = computedItme;
                                const Node = t.classMethod(
                                    "method",
                                    t.identifier(`get ${name}`),
                                    [],
                                    t.blockStatement(body.body),
                                    false,
                                    false,
                                    false,
                                    false
                                );
                                classMethods.push(Node);
                            }
                            // 处理 computed 的 对象表达式
                            if (
                                computedItme.type === "ObjectProperty" &&
                                computedItme.value.type === "ObjectExpression"
                            ) {
                                const {
                                    key: { name },
                                } = computedItme;
                                // 处理 get
                                const get = computedItme.value.properties.find(
                                    (item) => item.key.name === "get"
                                );
                                if (get) {
                                    const { body } = get;
                                    const Node = t.classMethod(
                                        "method",
                                        t.identifier(`get ${name}`),
                                        [],
                                        t.blockStatement(body.body),
                                        false,
                                        false,
                                        false,
                                        false
                                    );
                                    classMethods.push(Node);
                                }

                                // // 处理 set
                                const set = computedItme.value.properties.find(
                                    (item) => item.key.name === "set"
                                );
                                if (set) {
                                    const {
                                        value: { body },
                                    } = set;
                                    const Node = t.classMethod(
                                        "method",
                                        t.identifier(`set ${name}`),
                                        [],
                                        t.blockStatement(body.body),
                                        false,
                                        false,
                                        false,
                                        false
                                    );
                                    classMethods.push(Node);
                                }
                            }
                        });
                    }
                    // 处理 watch
                    if (item.key.name === "watch") {
                        // 枚举watch用法
                        // watch: {
                        //     watchData1: function (newVal, oldVal) { /* ... */ },
                        //     watchData2(newVal, oldVal) { /* ... */ },
                        //     watchData3: 'someMethod',
                        //     watchData4: ['someMethod', 'anotherMethod'],
                        //     watchData5: {
                        //       handler: function (newVal, oldVal) { /* ... */ },
                        //       deep: true
                        //     },
                        //     watchData6: {
                        //       handler(newVal, oldVal) { /* ... */ },
                        //       deep: true
                        //     }
                        // }
                        importSpecifierOpt.push("Watch");

                        const watch = item.value.properties;
                        if (watch.length === 0) return;

                        watch.forEach((watchItem) => {
                            // 处理watch的es6函数表达式 例如： watchData2(newVal, oldVal) { /* ... */ },
                            if (watchItem.type === "ObjectMethod") {
                                const {
                                    async,
                                    generator,
                                    computed,
                                    params,
                                    body,
                                    key: { name },
                                } = watchItem;
                                const Node = t.classMethod(
                                    "method",
                                    t.identifier(`on${watchFnName(name)}Change`),
                                    params,
                                    t.blockStatement(body.body),
                                    computed,
                                    false,
                                    generator,
                                    async
                                );
                                Node.decorators = [t.decorator(t.identifier(`Watch('${name}')`))];
                                classMethods.push(Node);
                            }
                            // 处理watch的字符串 例如： watchData3: 'someMethod',
                            if (
                                watchItem.type === "ObjectProperty" &&
                                watchItem.value.type === "StringLiteral"
                            ) {
                                // console.log(watchItem.value.type , "watchItem.value");
                                const {
                                    key: { name },
                                } = watchItem;
                                const Node = t.classMethod(
                                    "method",
                                    t.identifier(`on${watchFnName(name)}Change`),
                                    [t.identifier("newVal"), t.identifier("oldVal")],
                                    t.blockStatement([
                                        t.expressionStatement(
                                            t.callExpression(
                                                t.identifier("this." + watchItem.value.value),
                                                [t.identifier("newVal"), t.identifier("oldVal")]
                                            )
                                        ),
                                    ]),
                                    false,
                                    false,
                                    false,
                                    false
                                );
                                Node.decorators = [t.decorator(t.identifier(`Watch('${name}')`))];
                                classMethods.push(Node);
                            }
                            // 处理watch的数组 例如： watchData4: ['someMethod', 'anotherMethod'],
                            if (
                                watchItem.type === "ObjectProperty" &&
                                watchItem.value.type === "ArrayExpression"
                            ) {
                                const eventItem = watchItem.value.elements;

                                // 处理字符串的数组
                                eventItem.forEach((item, index) => {
                                    // 数组里面是字符串
                                    if (item.type === "StringLiteral") {
                                        const Node = t.classMethod(
                                            "method",
                                            t.identifier(
                                                `on${watchFnName(item.value)}${index}Change`
                                            ),
                                            [t.identifier("newVal"), t.identifier("oldVal")],
                                            t.blockStatement([
                                                t.expressionStatement(
                                                    t.callExpression(
                                                        t.identifier("this." + item.value),
                                                        [
                                                            t.identifier("newVal"),
                                                            t.identifier("oldVal"),
                                                        ]
                                                    )
                                                ),
                                            ]),
                                            false,
                                            false,
                                            false,
                                            false
                                        );
                                        Node.decorators = [
                                            t.decorator(
                                                t.identifier(`Watch('${watchItem.key.name}')`)
                                            ),
                                        ];
                                        classMethods.push(Node);
                                    }
                                    // 数组里面是函数
                                    if (item.type === "FunctionExpression") {
                                        const {
                                            async,
                                            generator,
                                            computed,
                                            params,
                                            body,
                                            id: { name },
                                        } = item;
                                        const Node = t.classMethod(
                                            "method",
                                            t.identifier(`on${watchFnName(name)}${index}Change`),
                                            params,
                                            t.blockStatement(body.body),
                                            computed,
                                            false,
                                            generator,
                                            async
                                        );
                                        Node.decorators = [
                                            t.decorator(
                                                t.identifier(`Watch('${watchItem.key.name}')`)
                                            ),
                                        ];
                                        classMethods.push(Node);
                                    }
                                    // 数组里面是对象
                                    if (item.type === "ObjectExpression") {
                                        const watch = item.properties;
                                        const handler = watch.find(
                                            (item) => item.key.name === "handler"
                                        );
                                        const deep = watch.find((item) => item.key.name === "deep");
                                        const immediate = watch.find(
                                            (item) => item.key.name === "immediate"
                                        );

                                        // console.log(handler , "handler");
                                        if (handler) {
                                            const body = handler.body ?? handler.value.body;
                                            const name = watchItem.key.name;
                                            const params = handler.params ?? handler.value.params;

                                            const Node = t.classMethod(
                                                "method",
                                                t.identifier(
                                                    `on${watchFnName(name)}${index}Change`
                                                ),
                                                params,
                                                t.blockStatement(body.body),
                                                false,
                                                false,
                                                false,
                                                false
                                            );

                                            Node.decorators = [
                                                t.decorator(
                                                    t.callExpression(t.identifier("Watch"), [
                                                        t.stringLiteral(watchItem.key.name),
                                                        t.objectExpression(
                                                            [deep, immediate]
                                                                .filter((item) => item)
                                                                .map((item) => {
                                                                    return t.objectProperty(
                                                                        t.identifier(item.key.name),
                                                                        t.booleanLiteral(
                                                                            item.value.value
                                                                        )
                                                                    );
                                                                })
                                                        ),
                                                    ])
                                                ),
                                            ];
                                            classMethods.push(Node);
                                        }
                                    }
                                });
                            }

                            // 处理watch的对象 例如： watchData5: { handler: 'someMethod', deep: true },
                            // if( watchItem.type === "ObjectProperty" && watchItem.value.type === "ObjectExpression" ){
                            //     const {
                            //         key: { name },
                            //     } = watchItem;
                            //     const Node = t.classMethod(
                            //         "method",
                            //         t.identifier(`on${watchFnName(name)}Change`),
                            //         [t.identifier("newVal"), t.identifier("oldVal")],
                            //         t.blockStatement([
                            //             t.expressionStatement(
                            //                 t.callExpression(
                            //                     t.identifier("this." + watchItem.value.properties[0].value.value),
                            //                     [t.identifier("newVal"), t.identifier("oldVal")]
                            //                 )
                            //             ),
                            //         ]),
                            //         false,
                            //         false,
                            //         false,
                            //         false
                            //     );
                            //     Node.decorators = [
                            //         t.decorator(t.identifier(`Watch('${name}')`)),
                            //     ];
                            //     classMethods.push(Node);
                            // }
                        });
                    }

                    // 处理 mixins
                    if (item.key.name === "mixins") {
                        importSpecifierOpt.push("Mixins");
                        const mixins = item.value.elements;
                        mixins.forEach((mixinsItem) => {
                            if (mixinsItem.type === "Identifier") {
                                mixinsOpt.push(mixinsItem.name);
                            }
                        });
                    }

                    // 处理 components
                    if (item.key.name === "components") {
                        const components = item.value.properties;
                        components.forEach((componentItem) => {
                            componentsOpt.push(componentItem.key.name);
                        });
                    }
                }

                if (item.type === "ObjectMethod") {
                    // 处理data属性
                    if (item.key.name === "data") {
                        const data = item.body.body.filter(
                            (item) => item.type === "ReturnStatement"
                        )[0].argument.properties;
                        data.forEach((item) => {
                            const type = item.value.type;
                            classProperties.push(
                                t.classProperty(
                                    t.identifier(`public ${item.key.name}`),
                                    item.value,
                                    t.typeAnnotation(
                                        t.genericTypeAnnotation(
                                            t.identifier(babel2tsTypeMap[type] || "any")
                                        )
                                    ),
                                    // [ t.decorator( t.identifier("State()") ) ],
                                    [],
                                    false,
                                    false
                                )
                            );
                        });
                    }
                    // 处理生命周期
                    if (item.key.name === lifecycleMap.find((it) => it === item.key.name)) {
                        const {
                            async,
                            generator,
                            computed,
                            params,
                            body,
                            key: { name },
                        } = item;
                        classMethods.push(
                            t.classMethod(
                                "method",
                                t.identifier(name + " "),
                                params,
                                t.blockStatement(body.body),
                                computed,
                                false,
                                generator,
                                async
                            )
                        );
                    }
                }
            });

            const hasMixinsStr = mixinsOpt.length
                ? `extends Mixins(${mixinsOpt.join(",")})`
                : "extends Vue";
            const identifierExp = `${className || ""} ${hasMixinsStr}`;

            const classDeclaration = t.exportDefaultDeclaration(
                t.classDeclaration(
                    t.identifier(identifierExp),
                    null,
                    t.classBody([
                        t.classProperty(
                            t.identifier("@Prop() readonly name!: string"),
                            null,
                            t.typeAnnotation(
                                t.genericTypeAnnotation(t.identifier("any | undefined"))
                            ),
                            [],
                            false,
                            false
                        ),
                        ...classProperties,
                        ...classMethods,
                        // t.classMethod(
                        //     "method",
                        //     t.identifier("onLaunch "),
                        //     classMethods[0].params,
                        //     t.blockStatement(classMethods[0].body.body),
                        //     false,
                        //     false,
                        //     false,
                        //     true
                        // ),
                    ])
                )
            );
            path.insertBefore(
                t.importDeclaration(
                    [
                        ...importSpecifierOpt.map((item) => {
                            return t.importSpecifier(t.identifier(item), t.identifier(item));
                        }),
                    ],
                    t.stringLiteral("vue-property-decorator")
                )
            );
            componentsOpt = Array.from(new Set(componentsOpt));
            path.insertBefore(
                t.decorator(
                    // t.identifier("Component({})")
                    t.callExpression(
                        t.identifier("Component"),
                        componentsOpt.length < 1
                            ? []
                            : [
                                  t.objectExpression(
                                      componentsOpt.length
                                          ? [
                                                t.objectProperty(
                                                    t.identifier("components"),
                                                    t.objectExpression(
                                                        componentsOpt.map((item) => {
                                                            return t.objectProperty(
                                                                t.identifier(item),
                                                                t.identifier(item),
                                                                false,
                                                                true
                                                            );
                                                        })
                                                    ),
                                                    false,
                                                    true
                                                ),
                                            ]
                                          : []
                                  ),
                              ]
                    )
                )
            );
            path.replaceWith(classDeclaration);
        },
    });

    const output = generate(ast, {}, code);
    function getOutFilePath(fileName: string): string {
        const baseFileName = filePath.match(/\w+(?=(\.|$))/)![0];
        const mt = fileName.match(/(.+?)(\w+)(\.\w+|$)/) as string[];
        return mt[1] + baseFileName + "2ts" + mt[3];
    }

    const newVueCode = vueCode.replace(/<script.*>([\s\S]*)<\/script>/, (mt) => {
        return `
<script lang="ts">
    ${output.code}
</script>`;
    });

    fs.writeFileSync(getOutFilePath(filePath), newVueCode);
    console.info( `文件 ${filePath} ， ----> 转换ts成功`);
    return newVueCode;
}
