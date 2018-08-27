debug=false;

const dns=require('dns');

exports.client=Client=function(sock,props)
{
	var $this=this;

	this.socket=sock;

	this.props_filter=(a) =>
	{
		var mask=
				{
					starttime: (+new Date()/1000).toFixed(0),
					alias: sock.remoteAddress,
					enabled: true,
					active: true,
					ip: sock.remoteAddress,
					hostname: '',
					loadavg: [0,0,0],
					tasks: [] // todo: aliases of tasks
				},
			r={};

		for(var i in mask)
			if(a[i]===undefined) r[i]=mask[i];
			else r[i]=a[i];

		return r;
	};

	this.props=this.props_filter(props || {});

	dns.reverse(this.props.ip,(err,hostname) =>
	{
		if(hostname && hostname.length>0) this.props.alias=this.props.hostname=hostname;
	});

	this.ev=
	{
		connect: () => {},
		disconnect: () => {},
		error: () => {},

		start: () => {},
		stdout: (data) => {},
		stderr: (data) => {},
		exit: () => {}
	};

	this.socket.on('data',(data) =>
	{
		var adata=data.toString().split(String.fromCharCode(10));

		adata.forEach((e,i) =>
		{
			if(!e) return;

			var jdata;

			try
			{
				jdata=JSON.parse(e);
			}
			catch(e)
			{
				console.error('data parse error',data.toString(),debug ? e : '');
			}

			if(jdata!==undefined)
			{
				console.log(jdata);
			}
		});
	})
	.on('error',e => this.ev.error(e))
	.on('close',e =>
	{
		this.props.active=false;
		this.ev.disconnect();
	});

	this.toData=() => this.props_filter(this.props);
};

exports.clientlist=ClientList=function()
{
	var clients=[];

	this.add=function(sock,props)
	{
		var client=new Client(sock,props || {});

		this.addObject(client);

		return client;
	};

	this.addObject=function(client)
	{
		if(client instanceof Client)
		{
			clients.push(client);

			return true;
		}
		else return false;
	};

	this.items=function(index)
	{
		if(typeof index=='number' && index<clients.length && index>=0) return clients[index];

		return false;
	};

	this.delete=function(index)
	{
		if(typeof index=='number' && index<clients.length && index>=0)
		{
			clients.splice(index,1);

			return true;
		}
		else return false;
	};

	this.deleteObject=function(client)
	{
		if(client instanceof Client)
		{
			var i=clients.indexOf(client);

			if(i>=0) return this.delete(i);
		}

		return false;
	};

	this.replaceObject=function(client,index)
	{
		if(client instanceof Client && typeof index=='number' && index<clients.length && index>=0)
		{
			clients.splice(index,1,client);

			return true;
		}

		return false;
	};

	this.count=() => clients.length;

	this.indexOfAlias=function(alias)
	{
		var r=-1;

		clients.some((e,i) =>
		{
			if(e instanceof Client && e.props.alias==alias)
			{
				r=i;
				return true;
			}

			return false;
		});

		return r;
	};

	this.toData=() => clients.map(e => e.toData());
};