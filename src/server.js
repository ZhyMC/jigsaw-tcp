const net=require("net");
const getPort=require("get-port");
const assert=require("assert");
const Q=require("q");
const EventEmitter=require("events").EventEmitter;

class TCPServer extends EventEmitter{
	constructor(jg){
		super();
		
		assert(jg,"jigsaw must be specified");

		this.jg=jg;
		this.connsinfo=new Map();
		this._start();
	}
	getSockets(){
		let socks=[];
		for(let [conn,info] of this.connsinfo.entries()){
			if(info.ready)
				socks.push(conn);
		}
		return socks;
	}
	hasSocket(connid){
		let vals=this.connsinfo.values();

		return Array.from(vals).find((x)=>{
			if(x.connid==connid && x.ready)
				return true;
		});
	}
	broadcast(chunk){
		let conns=this.getSockets();
		for(let conn of conns)
			conn.write(chunk);
		
	}
	async _start(){
		this.state="close";

		this.port=await getPort();
	
		this.sock=net.createServer();
		this.sock.listen(this.port);

		this.jg.port("_isTCPServer",()=>(true));
		this.jg.port("_heartbeat",this._handleHeartbeat.bind(this));
		this.jg.port("_getAddress",()=>{
			//return `${this.jg.jgenv.entry}:${this.port}`;
			return {address:this.jg.jgenv.entry,port:this.port};
		});
		this.jg.port("_hasSocket",({connid})=>{
			assert(connid,"connid must be specified");
			return {exists:this.hasSocket(connid)};
		})

		this.sock.on("listening",this._handleSReady.bind(this));
		this.sock.on("close",this._handleSClose.bind(this));
		this.sock.on("connection",this._handleConnection.bind(this));	
		this.sock.on("clientError",()=>{});	

		this.ticker=setInterval(()=>this._tickConnectons(),1000);
	}
	_tickConnectons(){
		for(let [conn,info] of this.connsinfo.entries()){
			info.life--;
			if(info.life<=0)
					conn.end();
		}
	}
	_handleHeartbeat({connid}){

		assert(connid,"connid must be specified");

		let conninfo=this.hasSocket(connid);
		assert(conninfo,"this connid doesn't exists");

		conninfo.life=20;

		return {ok:true}
	}
	_handleFirstChunk(conn,data){
		try{
			let conninfo=this.connsinfo.get(conn);
			if(conninfo.ready)
				return;

			//console.log("handle first chunk",data+"")
			let chunk=JSON.parse(data.toString());

			assert(typeof(chunk.connid)=="string","connid must at chunk payload");
			assert(chunk.connid.length>5,"chunk.connid.length not a valid value");

			
			conninfo.connid=chunk.connid;
			conninfo.ready=true;
			conninfo.ready_defer.resolve();
		}catch(err){
			console.log("init first chunk failed",err);
		}
	}
	async _handleConnection(conn){
		conn.on("error",()=>{});
		conn.on("close",()=>this._handleSocketClose(conn));
		conn.once("data",(data)=>this._handleFirstChunk(conn,data));

		
		let defer=Q.defer();
		let info={ready_defer:defer,ready:false,connid:"",life:20};
		this.connsinfo.set(conn,info);
		let timeout=setTimeout(()=>{defer.reject("init socket timeout")},5000)
		try{
			await defer.promise;
		}catch(err){
			throw err;
		}finally{
			clearTimeout(timeout);
		}

		this.emit("enter",conn,info.connid);

	}
	_handleSocketClose(conn){
		if(!this.connsinfo.has(conn))return;
		let connid=this.connsinfo.get(conn).connid;
		this.connsinfo.delete(conn);
		this.emit("leave",conn,connid);
	}
	_handleSReady(){
		if(this.state!="close")return;

		this.state="ready";
		this.emit("ready");
	}
	_handleSClose(){
		if(this.state=="close")return;
		this.state="close";
		this.emit("close");

		clearInterval(this.ticker);
	}
	close(){
		if(this.state=="close")return;

		this.sock.close();
	}
}


module.exports=TCPServer;