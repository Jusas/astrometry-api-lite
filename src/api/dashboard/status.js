Vue.component("status", {
  data: () => {
    return {
      latestJobs: [
      ],
      status: {
        activeWorkers: [],
        workerManagerRunning: null
      },
      downloadedImage: null,
      supports: {},
      openDetails: [],
      timeoutHandle: null
    }
  },
  beforeMount() {
    let self = this;
    this.getSupportData();
    this.updateData();
    this.timeoutHandle = setInterval(() => {
      self.updateData();
    }, 5000);
  },
  beforeDestroy() {
    if(this.timeoutHandle != null) {
      clearInterval(this.timeoutHandle);
    }
  },
  methods: {
    getSupportData: function () {
      let self = this;
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
      const url = `${baseUrl}/api/stats/supports`;
      axios.default.get(url).then((response) => {
        self.supports = response.data;
      });
    },
    cancelJob: function (job) {
      if (job.cancel_requested) {
        return;
      }
      let self = this;
      const jobId = job.id;
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
      const statsUrl = `${baseUrl}/api/job-control/cancel/${jobId}`;
      axios.default.get(statsUrl).then((response) => {
        self.status = response.data;
        job.cancel_requested = true;
        self.updateData();
      });
    },
    updateData: function () {
      let self = this;
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
      const statsUrl = `${baseUrl}/api/stats/workers`;
      axios.default.get(statsUrl).then((response) => {
        self.status = response.data;
      });

      const latestJobsUrl = `${baseUrl}/api/stats/latest`;
      axios.default.get(latestJobsUrl).then((response) => {
        self.latestJobs = response.data;
      });
    },
    toggleDetails: function (job) {
      const itemIdx = this.openDetails.indexOf(job.id);
      if (itemIdx == -1)
        this.openDetails.push(job.id);
      else
        this.openDetails.splice(itemIdx, 1);
    },
    isOpen: function (job) {
      return this.openDetails.indexOf(job.id) != -1;
    },
    triggerThumbModal: function (jobId, imgType) {
      this.downloadedImage = null;
      let self = this;
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
      let imgUrl = `${baseUrl}/api/result-images/`;
      if (imgType == 'objs') {
        imgUrl += `objects/${jobId}`
      }
      else {
        imgUrl += `annotation/${jobId}`
      }

      axios.default.get(imgUrl).then((response) => {
        self.downloadedImage = response.data;
      });

      $('#thumbModal').modal();
    },
    makeDate: function (timestamp) {
      if (!timestamp) {
        return "-";
      }
      var date = new Date(timestamp);
      return `${date.getFullYear()}-${("0" + date.getMonth()).slice(-2)}-${("0" + date.getDate()).slice(-2)} ${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}`
    },
    makeTimespan: function (millisecs) {
      if (!millisecs) {
        return "-";
      }
      var seconds = millisecs / 1000;
      var minutes = parseInt(seconds / 60);
      var secondsWithMillis = seconds - minutes * 60;
      var fullSecs = parseInt(secondsWithMillis);
      var millis = `${(secondsWithMillis - fullSecs)}`.substr(2, 3);
      return `${("0" + minutes).slice(-2)}:${("0" + fullSecs).slice(-2)}.${millis}`;
    }
  }
})