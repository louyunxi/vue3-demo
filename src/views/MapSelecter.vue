<template>
  <div class="MapSelecter">
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-undef */
import { defineComponent, reactive } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
type myQuery = {
  data: string;
};
export default defineComponent({
  name: "MapSelecter",
  components: {},
  data() {
    return {};
  },
  setup(){
    
    document.title="在地图上选择地块";
  },
  methods: {
    initMap() {
      let map = L.map("map", {
        minZoom: 3,
        maxZoom: 14,
        center: [39.550339, 116.114129],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        crs: L.CRS.EPSG3857,
      });
      L.tileLayer(
        "http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
      ).addTo(map);
      L.tileLayer(
        "https://map.snkoudai.com/maps/vt/lyrs=s&hl=zh-CN&gl=cn&scale=1&x={x}&y={y}&z={z}"
      ).addTo(map);
      return reactive(map);
    },
    getQuery(params: myQuery) {
      if (!params || typeof params !== "string") return {};
      var data: string = (params as myQuery).data;
      return eval(decodeURIComponent(data));
    },
  },
  mounted() {
    const query = this.$route.query as myQuery;
    let uni = (window as any).uni;
    console.log(uni.webView.openLocation)
    document.addEventListener("UniAppJSBridgeReady", function() {
      uni.webView.getEnv((res: any) => {
        console.log("当前环境：" + JSON.stringify(res));
      });
      //uni.openLocation
      console.log(uni)
      uni.postMessage({
        data: {
          name: "11111111",
          age: 31,
          list: [
            { name: "5435", age: 334 },
            { name: "5435", age: 334 },
            { name: "5435", age: 334 },
          ],
        },
      });
    });
    var map = this.initMap();
    console.log(map);
  },
});
</script>
<style scoped lang="stylus">
.MapSelecter{
  width:100vw;
  height:100vh;
  background-color:#fff;
  #map{
    width: 100%;
    height: 100%;
  }
}
</style>
