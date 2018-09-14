const gulp = require("gulp");//这里也相当于找gulp/index.js
const htmlmin = require("gulp-htmlmin");

//全局配置 因为他模块了 所以不用.js
//const config = require("./config/index")
//因为取得是index 所以可以省略index 找config时候自己会去找index
const config = require("./config");

//热更新服务器
const connect = require("gulp-connect");
//合并文件 --合并只是放一起--压缩才会真正合并相同样式
const concat = require('gulp-concat');
//压缩css文件
const minifycss = require('gulp-minify-css');
//设置压缩后的文件名
const rename = require('gulp-rename');
//给 CSS 增加前缀。解决某些CSS属性不是标准属性，有各种浏览器前缀的情况
const autoprefixer = require('gulp-autoprefixer');
//合并任意数量的流。返回合并的流
const merge = require("merge-stream");
//小型webpack
const webpack = require("webpack-stream");

//处理html，将src中的html文件输出到dist中
gulp.task("handle:html",function(){
    //html压缩配置
    return gulp.src("./src/views/*/*.html")
        .pipe(htmlmin(config.htmloptions))
        .pipe(gulp.dest("./dist"))
})

//处理css 合并css 压缩css 加前缀 输出
gulp.task("handle:css",function(){
    //1 希望可以合并成多个css 更灵活 2 多页面的灵活处理
    let streams = [];//定义一个数组 存放下面的多个文件流
    for (const page in config.cssoptions) {
        //希望循环cssoptions里面的一个个键值对 循环对象用forin
        for (const file in config.cssoptions[page]) {
            //循环多次执行 不能加return 它会第一次执行完就返回
            let stream = gulp.src(config.cssoptions[page][file])
                       .pipe(autoprefixer({
                            browsers: ['last 2 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],//last 2 versions- 主流浏览器的最新两个版本
                            cascade: false, //是否美化属性值 默认：true 像这样：
                            //-webkit-transform: rotate(45deg);
                            //        transform: rotate(45deg);
                            remove:true //是否去掉不必要的前缀 默认：true 
                        }))
                       .pipe(concat(file + ".css"))
                       .pipe(minifycss())
                       .pipe(rename({ suffix:'.min' }))//suffix 加中间的名字
                       .pipe(gulp.dest("./dist/"+page+"/css"))
            streams.push(stream);//把当前的文件流存储到数组中
        }
    }
    return merge(...streams);//合并多个文件流 
    //... 来自 es6 展开运算符  var a=[1,2,3,4] var b = [...a,5,6,7]
    //var a = {x:1,y:2}   var b = {...a,z:3}
})

//处理JS es6->es5 合并 压缩

gulp.task("handle:js",function(){
    // gulp.src("src/entry.js")//这里瞎写一个就行
    //     .pipe(webpack({
    //         //真正的处理都是在这里的
    //         mode :"production",//设置打包模式 none development production
    //         //单入口 单出口
    //         // entry : "./src/views/index/javascript/index",//入口
    //         // output: {
    //         //     filename :"index.js"//控制打包之后文件名字 代替了rename
    //         // }
    //         //多入口 单出口 数组中谁在前面 打包的时候谁也在前面
    //         // entry : ["./src/views/index/javascript/index.js","./src/views/index/javascript/vendor.js"],//入口
    //         // output: {
    //         //     filename :"index.js"//控制打包之后文件名字 代替了rename
    //         // }
    //         //多入口 多出口
    //         entry : {
    //             index : "./src/views/index/javascript/index.js",
    //             vendor : "./src/views/index/javascript/vendor.js"
    //           },
    //         output: {
    //             filename :"[name].min.js"//控制打包之后文件名字 代替了rename
    //         }
    //     }))
    //     .pipe(gulp.dest("./dist/index/js"))
    let streams = []
    for (const page in config.jsoptions) {
        //判断如果入口是数组或者是字符串的话就是单出口，否则是多出口
        let entry = config.jsoptions[page]
        let filename = Array.isArray(entry) || ((typeof entry) === 'string') ? page : '[name]'
        let stream = gulp.src('src/entry.js')
            .pipe(webpack({
                mode: 'production',
                entry: entry,
                output: { filename: filename+'.min.js' }
            }))
            .pipe(gulp.dest('./dist/' + page + '/js'))
        streams.push(stream)
    }

    return merge( ...streams )

})

//监听函数
gulp.task("watch" , function(){
    gulp.watch("./src/views/*/*.html",["handle:html","reload"])
    gulp.watch("./src/**/*.css",["handle:css","reload"])
    gulp.watch("./src/**/*.js",["handle:js","reload"])
    //* 儿子  ** 所有后代
})

//创建热更新服务器
gulp.task("server",function(){
    connect.server(config.serveroptions);
})

//让服务器刷新的任务
gulp.task("reload", function(){
	return gulp.src(["./dist/**/*.html"])//让所有的html文件都重新加载一下
		.pipe(connect.reload());  
})


gulp.task("default" , ["server","handle:html","handle:css","handle:js","watch"])