class SuccessResponse {
    constructor(statusCode, message, data) {
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
    }
  
    send(res) {
      res.json({
        status: true,
        statusCode:this.statusCode,
        message: this.message,
        data: this.data
      });
    }
  }
  
  module.exports = SuccessResponse;
  