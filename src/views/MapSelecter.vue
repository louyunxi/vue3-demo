<template>
  <div class="MapSelecter">
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-undef */
import { defineComponent } from "vue";
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
  setup() {
    document.title = "在地图上选择地块";
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
      return map;
    },
    /* initLandAndMarker(map, areaList, zoom, onlyMarker = false) {
      //初始化地块层
      //绘制多边形地块
      if (!onlyMarker) {
        areaList.forEach((landData, index) => {
          if (
            !landData["path"] ||
            !(JSON.parse(landData["path"]) instanceof Array)
          )
            return;
          var landPath = JSON.parse(landData["path"]);
          var landPolygon = this.initPolygon(
            index,
            landData.landName,
            landData["id"],
            landPath,
            landData["fillColor"],
            landData["fillColor"],
            0.3
          );
          this.allpolygon.push(landPolygon);
        });
        var polygonsLayer = L.layerGroup(this.allpolygon); //地块轮廓 合并成组 一次性添加
        polygonsLayer.addTo(map);
      }
      //初始化 选择作物图标层
      this.allMarker.length &&
        this.clearMarkersFromLayer(this.allMarkerLayer, this.allMarker); //清空已绘制marker
      if (!this.allMarkerLayer) {
        this.allMarkerLayer = L.canvasIconLayer({}).addTo(map);
        this.allMarkerLayer._canvas.className += " cropMarkerLayer"; //marker 层canvas 加样式
      }
      //绘制选择作物图标
      areaList.forEach((landData, index) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        var landPath = JSON.parse(landData["path"]);
        var markerImages = landData["cropList"].map((item) => item["imgUrl"]);
        var markerCenter = [
          landData["landCenterLat"],
          landData["landCenterLng"],
        ];
        if (landData.markerCenter) {
          markerCenter = landData.markerCenter;
        } else {
          //marker 中心点 处理
          if (markerImages.length > 0) {
            var result = relatedpointer.pointerIsInMapfn(
              markerCenter,
              landPath
            );
            if (!result && markerCenter) {
              markerCenter.length = 0;
              markerCenter = landData.markerCenter = relatedpointer.indexfn(
                landPath,
                11
              );
            }
          }
        }
        //是否是小于两亩的地块
        var unit = [0, 666.7, 66.67, 1];
        var landAcre =
          unit[landData["landAcreUnit"]] * parseFloat(landData["landAcre"]);
        var isSmallArea = landAcre < 1333.5 ? true : false; //是否为小于2亩的小地块   //marker显示 特殊处理
        var landIconOptions = this.getLandMarkerOptions(
          zoom,
          markerCenter,
          markerImages,
          isSmallArea,
          1
        ); //获取单个地块下 所有图标 样式
        var landMarker = landIconOptions.map((option) => {
          return this.initMarker(
            option.markerImage,
            option.wh,
            option.anchor,
            option.center
          );
        });
        this.allMarker.push(...landMarker);
      });
      this.allMarker.length && this.allMarkerLayer.addMarkers(this.allMarker); //marker 合并成组 一次性添加
    },
    initPolygon: function(
      index,
      name,
      areaid,
      path,
      bordercolor,
      fillcolor,
      fillOpacity,
      canvasRender = null
    ) {
      var This = this;
      var option = {
        color: bordercolor || "#64C3A4",
        fillColor: fillcolor || "#64C3A4",
        fillOpacity: fillOpacity || 0.5,
        className: "polygonbox",
        weight: 2,
      };
      if (canvasRender) {
        option["renderer"] = canvasRender;
      }
      var polygon = L.polygon(path, option);
      polygon.landName = name;
      polygon.areaColor = fillcolor;
      polygon.areaid = areaid;
      polygon.index = index;
      return polygon;
    }, */
    getQuery(params: myQuery) {
      if (!params || typeof params !== "string") return {};
      var data: string = (params as myQuery).data;
      return eval(decodeURIComponent(data));
    },
  },
  mounted() {
    const query = this.$route.query as myQuery;
    let uni = (window as any).uni;
    console.log(uni.webView.openLocation);
    document.addEventListener("UniAppJSBridgeReady", function() {
      uni.webView.getEnv((res: any) => {
        console.log("当前环境：" + JSON.stringify(res));
      });
      //uni.openLocation
      console.log(uni);
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
