var tbee = new TBee();
var config = {
  serialport: '/dev/USB0',
  baudrate: '57600',
  url: 'localhost:3000'
};

tbee.init(config);
tbee.run();



