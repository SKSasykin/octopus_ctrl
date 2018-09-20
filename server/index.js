debug=true;

const net=require('net');
const { client,clientlist }=require('./client');
const { task,tasklist }=require('./task');
// const cron=require('./cron');

module.exports=Server=function()
{
	var $this=this;

	this.config={ connection: { port: 6778 } };

	// this.cron=new cron();
	this.tasks=new tasklist();
	this.clients=new clientlist();

	this.tasks.ev=
	{
		kill: (task) =>
		{
			var client=this.clients.itemOfAlias(task.props.client);

			if(!task.props.execution.end)
			{
				client.socket.send({ action:'kill', task:task.props.alias });
			}
		},

		run: (task) =>
		{
			var client;

			if(client=this.clients.lazyClient(80,task.props.priority))
			{
				// task.props.client=client.props.alias;

				client.socket.send({ action:'run', task:task.props.alias,props:task.props });
			}
			else console.log('Can\'t start "'+task.props.alias+'". Not found any client.');
		},

		update_prop: (prop,value,task) => {}

	};

	this.clients.ev=
	{
		connect:	(client)		=> { if(debug) console.log('connect from',client.socket.remoteAddress); },
		disconnect:	(client)		=> { if(debug) console.log('disconnect from',client.socket.remoteAddress); },
		error:		(error,client)	=> { if(debug) console.log('clients error',error,client); },

		start:	(starttime,pid,task,client) =>
		{
			if(debug) console.log('start',task,' from ',client.props.alias);

			this.tasks.dispatchMessages([{ action:'start', task, client, starttime, pid }]);
		},
		stdout:	(text,task,client) =>
		{
			if(debug) console.log('stdout from',client.props.alias,'/',task,':',text);

			this.tasks.dispatchMessages([{ action:'stdout', task, client, text }]);
		},
		stderr:	(text,task,client) =>
		{
			if(debug) console.log('stderr from',client.props.alias,'/',task,':',text);

			this.tasks.dispatchMessages([{ action:'stderr', task, client, text }]);
		},
		exit:	(endtime,err_code,task,client) =>
		{
			if(debug) console.log('exit code:',err_code,task,' from ',client.props.alias);

			this.tasks.dispatchMessages([{ action:'exit', task, client, endtime, err_code }]);
		}
	};

	this.set=function(k,v)
	{
		this[k]=v;

		return this;
	};

	this.run=() =>
	{
		this.server=net.createServer()
		.on('connection',sock =>
		{
			var c=new client(sock);

			var i;

			if((i=this.clients.indexOfAlias(c.props.alias))>=0)
			{
				if(this.clients.items(i).props.active) return sock.end('{"error":"Already connect from '+sock.remoteAddress+'"}');

				c.props.enabled=this.clients.items(i).props.enabled;
				this.clients.replaceObject(c,i);
			}
			else this.clients.addObject(c);

			sock.send('{"action":"accept"}');

			c.ev.connect();
		})
		.listen({
					port: this.config.connection.port,
					host: '0.0.0.0',
					exclusive: true
				},
				() => { console.log('octopus server runing on','\t:'+this.config.connection.port); }
		);
	};
};
