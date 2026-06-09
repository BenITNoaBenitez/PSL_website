function domaine(x)
{
	var i=x.host.indexOf(":");
	return (i>=0)?x.host.substring(0,i):x.host;
}

function goLinks(obj,lnks,i)
{
	var img = new Image();
		
	lien = 'isens_marker.php?externe=1&version=' + version + '&page=' + encodeURIComponent(obj.href);
	s = screen;
	lien += '&screen=' + s.width + 'x' + s.height + 'x' + s.colorDepth;
	
	var today = new Date();
	lien += "&time=" + today.getTime();
			
	img.src = lien;
}

function isFileInterne(lien, domaine_interne)
{
	if ((lien.indexOf(domaine_interne) > 0) && (lien.indexOf("/files/") > 0)) return true;
	else return false;
}

function doLinks()
{
	temp = document.location.href;
	if (temp.indexOf("isens_stats.php") < 0)
	{
		lnks = new Object();
		var ln = document.links.length;
		lnks.li = new Array(ln);
		var domaine_courant = domaine(location);
		for (var i=0; i<ln; i++)
		{
			var buff = document.links[i] + "";
			if ((buff.indexOf("javascript:") == -1) && (document.links[i] != "#"))
			{
				if ((domaine_courant != domaine(document.links[i])) || isFileInterne(document.links[i].href, domaine_courant))
				{
					if (document.links[i].onclick == null) eval("document.links[i].onclick=function(){goLinks(this,lnks,i);}");
				}
			}
		}
	}
}

if (window.addEventListener) window.addEventListener("load", doLinks,false);
else window.attachEvent("onload", doLinks);