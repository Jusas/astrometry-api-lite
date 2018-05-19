var app = new Vue({
  el: "#app",
  data: {
    activeView: "status"
  },
  beforeMount() {
    
  },
  methods: {
    showConfigView: function () {
      this.activeView = "config";
    },
    showStatusView: function() {
      this.activeView = "status";
    }
  }
});