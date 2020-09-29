const net=require("net");
const assert=require("assert");
const util=require("util");
const Q=require("q");
const sleep=util.promisify(setTimeout);
const EventEmitter=require("events").EventEmitter;

class TCPClient extends EventEmitter{
	constructor(jg,servername){
		super();

		assert(jg,"jigsaw must be specified");
		assert(servername,"servername must be specified");
		
		this.jg=jg;
		this.servername=servername;
		this.connid=Math.random()+"";

		if(this.jg.state!="ready")
			this.jg.once("ready",()=>this._start());
		else
			this._start();

	}
	getSocket(){
		assert(this.state=="ready","at this state, can not getSocket");
		return this.sock;
	}
	_getServerAddress(){
		return this.jg.send(`${this.servername}:_getAddress`);
	}
	async _start(){
		this.state="close";
		this.life=10;

		let addr=await this._getServerAddress();
		this.sock=net.connect(addr.port,addr.address);
		this.sock.on("connect",this._onSocketConnected.bind(this));
		this.sock.on("close",this._onSocketClose.bind(this));
		this.sock.on("error",this._onSocketError.bind(this));
		
	}
	_onSocketError(){
		
	}
	async _onSocketConnected(){
		if(this.state!="close")return;

		this.state="connecting";
		try{
			await this._sendingFirstChunk();

			this.state="ready";
			this.emit("ready");

			this._startheartbeater();	

		}catch(err){
			this.close();
			console.error("init socket failed",err);
		}

	}
	async _sendingFirstChunk(){
		let payload=JSON.stringify({connid:this.connid});
		this.sock.write(Buffer.from(payload));

		for(let retry=0;retry<5;retry++){
			let ret=await this.jg.send(`${this.servername}:_hasSocket`,{connid:this.connid});
			if(ret.exists)
				return;
			await sleep(500);
		}
		throw new Error("sending first chunk failed");
	}
	_onSocketClose(){
		this.state="close";
		this.emit("close");
	}
	async _startheartbeater(){

		while(this.state=="ready"){
			try{
				let ret=await this.jg.send(`${this.servername}:_heartbeat`,{connid:this.connid});
				if(!ret || !ret.ok)
					throw new Error("hearbeat failed");
				this.life=10;
			}catch(err){
				if(this.life--<0)
					this.close();
				console.log(err);
			}

			await sleep(5*1000);
		}
	}
	
	close(){
		if(this.state=="close")return;

		this.sock.end();
	}
}


module.exports=TCPClient;