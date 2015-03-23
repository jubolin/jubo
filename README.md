jubo-iot
====

基于Meteor的IoT网关，支持Alljoyn和DDP协议。

### 设备定义
device: {
	"name": "xxx",
	"type": "bulb", 	      	// bulb、media、sensor
	"devid": "xxxx-xxx-xxxx", 	// generate by gateway
	"connector": "ddp",			// ddp、alljoyn、mqtt
	"location": "home.kitchen",
	"status": "on",				// on、off
	"statusColor": "#00ba00",
	"icon": "lighting-bulb.svg",
	"router": "jubo@bulbControl",
}


