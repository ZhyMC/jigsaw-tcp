const os=require("os");

function getLocalAddress(mac){
	let interfaces=os.networkInterfaces();
	let its=Object.values(interfaces);

	for(let int of its){
		for(let o of int)
			if(o.family=="IPv4")
				return o.address;
	}
	throw new Error("can not find the local address")	;
};

module.exports = getLocalAddress;
