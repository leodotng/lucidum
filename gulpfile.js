const gulp = require("gulp");
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify-es").default;

const jsFiles = "src/*.js";
const jsDests = ["dist", "examples"];
const destFileName = "lucidum";

gulp.task("default", function () {
  return gulp
    .src(jsFiles)
    .pipe(concat(`${destFileName}.js`))
    .pipe(
      babel({
        presets: ["@babel/env"]
      })
    )
    .pipe(rename(`${destFileName}.min.js`))
    .pipe(uglify())
    .pipe(gulp.dest(jsDests[0]))
    .pipe(gulp.dest(jsDests[1]));
});