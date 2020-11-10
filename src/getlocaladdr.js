const os=require("os");

function getLocalAddress(mac){
	let interfaces=os.networkInterfaces();
	let its=Object.values(interfaces);

	for(let int of its){
		for(let o of int){
			if(o.family!="IPv4")continue;
			if(o.internal)continue;
			if(o.mac=="00:00:00:00:00:00")continue;
			if(o.address=="127.0.0.1")continue;


			if(mac){
				if(o.mac==mac)
				return o.address;
			}else
				return o.address;
			
		}
	}
	throw new Error("can not find the local address")	;
};
module.exports = getLocalAddress;
