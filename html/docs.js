function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (docs) {pug_mixins["section"] = pug_interp = function(doc){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv id=\"#{doc.id}\"\u003E\u003Cdiv class=\"row\"\u003E\u003Ch2 id=\"section-title\"\u003E" + (null == (pug_interp = doc.title) ? "" : pug_interp) + "\u003C\u002Fh2\u003E\u003Cp\u003E" + (null == (pug_interp = doc.body) ? "" : pug_interp) + "\u003C\u002Fp\u003E\u003Cdiv class=\"tab-content\"\u003E\u003Cdiv class=\"tab-pane active\" id=\"java\"\u003E";
if (doc.sig.java) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well sig-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = doc.sig.java) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
if (doc.example.java) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well example-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = doc.example.java) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"tab-pane\" id=\"cs\"\u003E";
if (doc.sig.cs) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well sig-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = doc.sig.cs) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
if (doc.example.cs) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well example-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = doc.example.cs) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
if (doc.methods) {
// iterate doc.methods
;(function(){
  var $$obj = doc.methods;
  if ('number' == typeof $$obj.length) {
      for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
        var method = $$obj[i];
pug_mixins["subSection"](method);
      }
  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;
      var method = $$obj[i];
pug_mixins["subSection"](method);
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["subSection"] = pug_interp = function(method){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv id=\"#{method.id}\"\u003E\u003Cdiv class=\"row\"\u003E\u003Ch3 id=\"section-title\"\u003E" + (null == (pug_interp = method.title) ? "" : pug_interp) + "\u003C\u002Fh3\u003E\u003Cp\u003E" + (null == (pug_interp = method.body) ? "" : pug_interp) + "\u003C\u002Fp\u003E\u003Cdiv class=\"tab-content\"\u003E\u003Cdiv class=\"tab-pane active\" id=\"java\"\u003E";
if (method.sig.java) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well sig-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = method.sig.java) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
if (method.example.java) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well example-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = method.example.java) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"tab-pane\" id=\"cs\"\u003E";
if (method.sig.cs) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well sig-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = method.sig.cs) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
if (method.example.cs) {
pug_html = pug_html + "\u003Cdiv class=\"well custom-well example-well\"\u003E\u003Cpre\u003E\u003Ccode\u003E" + (null == (pug_interp = method.example.cs) ? "" : pug_interp) + "\u003C\u002Fcode\u003E\u003C\u002Fpre\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["nav"] = pug_interp = function(doc, i){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cli\u003E\u003Ca href=\"##{doc.id}\"\u003E" + (pug_escape(null == (pug_interp = doc.id) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fli\u003E";
if (doc.methods) {
// iterate doc.methods
;(function(){
  var $$obj = doc.methods;
  if ('number' == typeof $$obj.length) {
      for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
        var method = $$obj[i];
pug_mixins["subNav"](method);
      }
  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;
      var method = $$obj[i];
pug_mixins["subNav"](method);
    }
  }
}).call(this);

}
};
pug_mixins["subNav"] = pug_interp = function(method){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cli\u003E\u003Ca href=\"##{method.id}\"\u003E" + (pug_escape(null == (pug_interp = method.id) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fli\u003E";
};
pug_html = pug_html + "\u003Chtml lang=\"en\"\u003E\u003Chead\u003E\u003Cmeta http-equiv=\"Content-Type\" content=\"text\u002Fhtml; charset=UTF-8\"\u002F\u003E\u003Cmeta charset=\"utf-8\"\u002F\u003E\u003Ctitle\u003Emkzer0 - TankGame\u003C\u002Ftitle\u003E\u003Cmeta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"\u002F\u003E\u003Cmeta name=\"description\" content=\"\"\u002F\u003E\u003Cmeta name=\"description\" content=\"\"\u002F\u003E\u003Cmeta name=\"author\" content=\"\"\u002F\u003E\u003Clink rel=\"stylesheet\" type=\"text\u002Fcss\" href=\"css\u002Fmetro-bootstrap.css\"\u002F\u003E\u003Clink rel=\"stylesheet\" type=\"text\u002Fcss\" href=\"css\u002Fdocs.min.css\"\u002F\u003E\u003Clink rel=\"stylesheet\" type=\"text\u002Fcss\" href=\"css\u002Fbase.css\"\u002F\u003E\u003Clink rel=\"stylesheet\" type=\"text\u002Fcss\" href=\"css\u002Fdefault.css\"\u002F\u003E\u003Cscript src=\"scripts\u002Fhighlight.pack.js\"\u003E\u003C\u002Fscript\u003E\u003Cscript\u003E\n  hljs.initHighlightingOnLoad();\n\u003C\u002Fscript\u003E\u003C\u002Fhead\u003E\u003Cbody\u003E\u003Cdiv class=\"navbar navbar-default navbar-static-top\"\u003E\u003Cdiv class=\"navbar-header\"\u003E\u003Cdiv class=\"row\" style=\"margin: 0px;\"\u003E\u003Ca class=\"navbar-brand\"\u003E\u003Ch1 id=\"page-title\" style=\"margin-bottom: 20px;\"\u003ETank Game\u003C\u002Fh1\u003E\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"collapse navbar-collapse navbar-ex1-collapse\"\u003E\u003Cdiv class=\"nav navbar-nav navbar-left\"\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"nav navbar-nav navbar-right\"\u003E\u003Cimg class=\"bannerad-img\" src=\"resources\u002Fmkzer0.png\" title=\"ThemeForest\" alt=\"mkzer0_Logo\" style=\"height: 90px; margin: 8px; padding: 10px\"\u002F\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"container\" id=\"container\"\u003E\u003Cdiv class=\"jumbotron\" id=\"main-menu\"\u003E\u003Ch1 style=\"margin-top: 0;\"\u003ETank Game Docs\u003C\u002Fh1\u003E\u003Cp class=\"lead\"\u003EAPI Download and Documentation.\u003C\u002Fp\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"col-md-6 vertical-align-middle-tile\"\u003E\u003Ch1 class=\"download-text\"\u003EDownload the API here -\u003E\u003C\u002Fh1\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"col-md-6\"\u003E\u003Ca href=\"api\u002Fjava\u002Ftarget\u002Ftank-game-api-1.0-SNAPSHOT.jar\"\u003E\u003Cdiv class=\"thumbnail tile tile-double tile-purple\"\u003E\u003Ch1 class=\"tile-text\"\u003EJAVA API\u003C\u002Fh1\u003E\u003C\u002Fdiv\u003E\u003C\u002Fa\u003E\u003Ca href=\"api\u002Fmkzer0.TankGame.zip\"\u003E\u003Cdiv class=\"thumbnail tile tile-double tile-green gap-before\"\u003E\u003Ch1 class=\"tile-text\"\u003EC# API\u003C\u002Fh1\u003E\u003C\u002Fdiv\u003E\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"col-md-9\"\u003E";
// iterate docs
;(function(){
  var $$obj = docs;
  if ('number' == typeof $$obj.length) {
      for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
        var doc = $$obj[i];
pug_mixins["section"](doc);
      }
  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;
      var doc = $$obj[i];
pug_mixins["section"](doc);
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"col-md-3\"\u003E\u003Cdiv class=\"bs-sidebar hidden-print affix-top\" role=\"complementary\"\u003E\u003Cul class=\"nav nav-tabs\"\u003E\u003Cli class=\"active\"\u003E\u003Ca href=\"#java\" data-toggle=\"tab\"\u003EJAVA\u003C\u002Fa\u003E\u003C\u002Fli\u003E\u003Cli\u003E\u003Ca href=\"#cs\" data-toggle=\"tab\"\u003EC#\u003C\u002Fa\u003E\u003C\u002Fli\u003E\u003C\u002Ful\u003E\u003Cul class=\"nav bs-sidenav\"\u003E";
// iterate docs
;(function(){
  var $$obj = docs;
  if ('number' == typeof $$obj.length) {
      for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
        var doc = $$obj[i];
pug_mixins["nav"](doc, i);
      }
  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;
      var doc = $$obj[i];
pug_mixins["nav"](doc, i);
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003Cscript type=\"text\u002Fjavascript\" src=\"scripts\u002Fjquery-1.10.2.min.js\"\u003E\u003C\u002Fscript\u003E\u003Cscript type=\"text\u002Fjavascript\" src=\"scripts\u002Fbootstrap.min.js\"\u003E\u003C\u002Fscript\u003E\u003Cscript type=\"text\u002Fjavascript\" src=\"scripts\u002Fdocs.min.js\"\u003E\u003C\u002Fscript\u003E\u003C\u002Fbody\u003E\u003C\u002Fhtml\u003E";}.call(this,"docs" in locals_for_with?locals_for_with.docs:typeof docs!=="undefined"?docs:undefined));;return pug_html;}