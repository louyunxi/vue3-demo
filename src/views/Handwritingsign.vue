<template>
  <div class="Handwritingsign">
    <div class="info">
      <span class="title">请在下面白色区域手写姓名</span>
      <span class="clear" id="clearCanvas">
        <img src="~@/assets/images/icon-clear.png" alt="" />
        清空
      </span>
    </div>
    <div class="sign-container">
      <div id="canvas"></div>
    </div>
    <Button id="saveCanvas" @click="submit">确定</Button>
  </div>
</template>

<script>
import { defineComponent, onMounted,ref } from "vue";
import { useRoute } from "vue-router";
import { Button } from "vant";
import { aliOssFile } from "../http/server/oss.ts";
import { setToken } from "../utils/set-token";
import { Toast } from "vant";
export default defineComponent({
  name: "Handwritingsign",
  setup() {
    document.title = "被检查人签字";
    const route = useRoute();
    const queryStr = (route.query && route.query.data) || "";
    let query = getQuery(queryStr);
    if (!query.token || !query.baseUrl) return;
    setToken(query.token);
    let linecanvas;
    let signImg=ref("");
    if(query.signImg){
      signImg.value=query.signImg;
    }
    onMounted(async () => {
      linecanvas = new lineCanvas({
        el: document.querySelector("#canvas"),
        clearEl: document.querySelector("#clearCanvas"),
        // lineWidth: 1, // 线条粗细
        // color: 'black', // 线条颜色
        // background: '#fff'
      });
      if(signImg.value){
        var img=await getImage(signImg.value);
        linecanvas.cxt.drawImage(img,0,0,img.width,img.height,0,0,linecanvas.canvas.width,linecanvas.canvas.height);
      }
    });
    async function submit() {
      signImg.value =await submitImg(query.baseUrl, linecanvas.canvas);
      postMessage(signImg.value);
    }
    const postMessage = (url) => {
      let uni = window.uni;
      uni.postMessage({
        data: url,
      });
      uni.navigateBack({
        delta: 1,
      });
    };
    function lineCanvas(obj) {
      this.lineWidth = 3;
      this.color = "#000";
      this.background = "#fff";
      for (var i in obj) {
        this[i] = obj[i];
      }
      this.canvas = document.createElement("canvas");
      if (!(this.canvas.getContext && this.canvas.getContext("2d"))) {
        this.section = document.createElement("section");
        this.section.className = "errorCanvas";
        this.section.innerHTML = "对不起，当前浏览器暂不支持此功能！";
        this.el.prepend(this.section);
        return;
      }
      this.offsetTop = this.el.parentNode.offsetTop;
      this.offsetLeft = this.el.parentNode.offsetLeft;
      this.canvas.width = this.el.clientWidth;
      this.canvas.height = this.el.clientHeight;
      this.el.prepend(this.canvas);

      this.cxt = this.canvas.getContext("2d");
      this.cxt.fillStyle = this.background;
      this.cxt.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.cxt.strokeStyle = this.color;
      this.cxt.lineWidth = this.lineWidth;
      this.cxt.lineCap = "round"; // 线条末端添加圆形线帽，减少线条的生硬感
      this.cxt.lineJoin = "round"; // 线条交汇时为原型边角
      // 利用阴影，消除锯齿
      this.cxt.shadowBlur = 1;
      this.cxt.shadowColor = "#000";
      // 开始绘制
      this.canvas.addEventListener(
        "touchstart",
        function(e) {
          this.cxt.beginPath();
          this.cxt.moveTo(
            e.changedTouches[0].pageX - this.offsetLeft,
            e.changedTouches[0].pageY - this.offsetTop
          );
        }.bind(this),
        false
      );
      // 绘制中
      this.canvas.addEventListener(
        "touchmove",
        function(e) {
          this.cxt.lineTo(
            e.changedTouches[0].pageX - this.offsetLeft,
            e.changedTouches[0].pageY - this.offsetTop
          );
          this.cxt.stroke();
        }.bind(this),
        false
      );
      // 结束绘制
      this.canvas.addEventListener(
        "touchend",
        function() {
          this.cxt.closePath();
        }.bind(this),
        false
      );
      // 清除画布
      this.clearEl.addEventListener(
        "click",
        function() {
          this.cxt.fillStyle='#ffffff';
          this.cxt.fillRect(0,0,this.canvas.width, this.canvas.height);
        }.bind(this),
        false
      );
    }
    function base64ToFile(urlData, fileName) {
      let arr = urlData.split(",");
      let mime = arr[0].match(/:(.*?);/)[1];
      let bytes = atob(arr[1]);
      let n = bytes.length;
      let ia = new Uint8Array(n);
      while (n--) {
        ia[n] = bytes.charCodeAt(n);
      }
      return new File([ia], fileName, { type: mime });
    }
    async function submitImg(baseUrl, canvas) {
      var res = await aliOssFile.aliOssFileService(baseUrl);
      const fileName = "user_sign_"+new Date().getTime();
      const surDir = "/gov/supervision-sign";
      var file = base64ToFile(canvas.toDataURL("image/jpeg", 0.8), fileName);
      let uploadData = {
        OSSAccessKeyId: res.accessid,
        key: res.dir + surDir + "/" + file.name + ".jpg",
        expire: res.expire,
        host: res.host + "/",
        policy: res.policy,
        signature: res.signature,
        dir: res.dir + surDir,
        file: file,
      };
      const formData = new FormData();
      for (let key in uploadData) {
        formData.append(key, uploadData[key]);
      }
      try {
        await aliOssFile.uploadImgToOss(uploadData.host, formData);
        console.log(uploadData.host+uploadData.key)
        return uploadData.host+uploadData.key;
      } catch (error) {
        Toast("签名保存失败，请重试");
        return '';
      }
    }
    function getQuery(data) {
      if (!data) return "";
      return JSON.parse(decodeURIComponent(data));
    }
    function getImage(imgSrc){
      return new Promise(resolve=>{
        var img = new Image();
        img.onload = function(){
          resolve(img)
        }
        img.onerror = function(){
          resolve()
        }
        img.setAttribute("crossOrigin",'Anonymous')
        img.src = imgSrc;
      })
    }
    return {
      submit,
    };
  },
  methods: {},
  components: {
    Button,
  },
});
</script>
<style scoped lang="stylus">
.Handwritingsign{
  width:100%;
  height:100vh;
  background-color: rgb(247, 247, 247);
}
.info{
  width:100%;
  height:65px;
  padding:0 24px;
  box-sizing: border-box;
  display:flex;
  justify-content: space-between;
  align-items: center;
  span.title{
    font-size:16px;
    color #4E5969;
    line-height:24px;
  }
  span.clear{
    display:flex;
    align-items: center;
    color:#22B07D;
    font-size:14px;
    img{
      width:16px;
      margin:0 4px;
    }
  }
}
#saveCanvas{
  display: block;
  width:calc(100% - 48px);
  height:36px;
  background:#22B07D;
  color:#fff;
  margin:24px auto 0;
}

.sign-container{
  width:calc(100% - 48px);
  height: calc(100vh - 149px);
  box-sizing: border-box;
  margin:0 auto;
  #canvas {
    width:100%;
    height:100%;
      position: relative;
      background:#fff;
      canvas {
        display: block;
        width:100%;
        height:100%;
    }
    #clearCanvas,
    #saveCanvas {
        position: absolute;
        bottom: 0;
        z-index: 1;
        width: 50%;
        height: 40px;
        border: 1px solid #dedede;
        line-height: 40px;
        text-align: center;
    }
    #clearCanvas {
        left: 0;
    }
    #saveCanvas {
        right: 0;
    }
    .errorCanvas {
        width: 100%;
        height: 100%;
        text-align: center;
        transform: translateY(40%);
    }
  }
}
</style>
