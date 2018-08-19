exports.extend=function extend(child,parent)
{
	var F=function() { };
	F.prototype=parent.prototype;
	child.prototype=new F();
	child.prototype.constructor = child;
	child.parent=parent.prototype;
};

exports.totime=function(tick)
{
	var second=tick%60;
	var minute=Math.floor(tick/=60)%60;
	var hour=Math.floor(tick/=60)%60;
	var day=Math.floor(tick/24);

	return 	(day>0 ? day+' ' : '')+
			(hour<10 ? '0'+hour : hour)+':'+
			(minute<10 ? '0'+minute : minute)+':'+
			(second<10 ? '0'+second : second);
};