Vue.component("config", {
  data: function() {
    return {
      errors: [],
      config: {
        sigma: null,
        depth: null,
        saveObjImages: null,
        saveNgcImages: null,
        imageScale: null
      },
      saveStatus: "",
      saveStatusCode: 0
    }
  },
  beforeMount() {
    let self = this;
    this.getConfig();
  },
  methods: {
    getConfig: function() {
      let self = this;
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
      const url = `${baseUrl}/api/config`;
      axios.default.get(url).then((response) => {
        self.config = response.data;
      }).catch((err) => {
        if(err.response && err.response.status == 403) {
          self.errors.push("API responded with 403: the configuration editing is probably disabled in API config.")
        }
        else {
          self.errors.push("ERROR: Failed to retrieve config values. " + JSON.stringify(err));
        }
      });
    },
    validateAndSendForm: function(e) {
      this.saveStatus = "";
      this.saveStatusCode = 0;
      let self = this;
      if(this.validateForm(e)) {
        this.saveStatus = "Saving...";
        this.saveStatusCode = 1;
        this.errors.length = 0;
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
        const url = `${baseUrl}/api/config`;
        axios.default.post(url, this.config).then((response) => {
          self.config = response.data;
          self.saveStatus = "Saved!";
          self.saveStatusCode = 2;
        }).catch((err) => {
          if(err.response && err.response.status == 403) {
            self.errors.push("API responded with 403: the configuration editing is probably disabled in API config.")
          }
          self.errors.push("API request error: " + JSON.stringify(err));
          self.saveStatus = "Save failed!";
          self.saveStatusCode = 3;
        });
      }
    },
    validateForm: function(e) {
      console.log("this is", this)
      this.errors.length = 0;
      let scale = parseFloat(this.config.imageScale);
      if(!scale || scale < 0) {
        this.errors.push("Image scale must be a positive decimal number");
      }
      let sigma = parseFloat(this.config.sigma);
      if((!sigma && sigma != 0) || sigma < 0) {
        this.errors.push("Sigma must be a positive decimal number");
      }
      let depth = parseFloat(this.config.depth);
      if((!depth && depth != 0) || depth < 0) {
        this.errors.push("Depth must be a positive decimal number");
      }
      if(this.config.saveNgcImages == null) {
        this.config.saveNgcImages = false;
      }
      if(this.config.saveObjImages ==  null) {
        this.config.saveObjImages = false;
      }

      if(this.errors.length > 0) {
        e.preventDefault();
      }
      else {
        return true;
      }
    }
  }
});