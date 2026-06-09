// ie6 Detect
window.addEvent('domready', function()
{
	if( window.external && typeof window.XMLHttpRequest == "undefined" )
	{
		var context = $(document.body);
		var context_h = window.getScrollHeight();
		
		var overlay = new Element('div').addClass('ie6-overlay').inject( context ).setStyle('height',context_h);
		var alarm = new Element('div').addClass('ie6-box').inject( context );
		
		alarm.set('html', 'Vous utilisez Internet Explorer 6 et malheureusement ce navigateur est dépassé.<br /><br />Pour des raisons de sécurité et afin profiter au mieux des fonctionnalités de ce site nous vous invitons à le <a href="http://www.microsoft.com/france/windows/ie/" target="_blank">mettre à jour</a> <em>(via le site officiel de Microsoft).</em><br /><br />Si toutefois vous en avez assez d\'Internet Explorer, vous pouvez utiliser un navigateur alternatif comme <a href="http://www.mozilla-europe.org/fr/firefox/" target="_blank">Firefox</a>, <a href="http://www.google.com/chrome/?hl=fr" target="_blank">Chrome</a> ou <a href="http://www.apple.com/fr/safari/download/" target="_blank">Safari</a>!<br /><br />Merci de votre compréhension.');
	}
});


// home focus
window.addEvent('domready', function()
{
	var products = $$('#block-focus img');
	
	products.each
	(
		function(product)
		{
			var title = new Element('span',{'class':'title'}).set('html', product.getProperty('alt') ).injectBefore(product);
			var lnk =  new Element('span',{'class':'link'}).set('html','En savoir plus').injectAfter(product);
		}
	);
});


// devis automatique
window.addEvent('domready', function()
{
	if( ! $(document.body).hasClass('produits') ) return;
	
	if( $(document.body).hasClass('level-1') || $(document.body).hasClass('level-0') ) return;
	
	var elements = $$('div.twolife');
	
	elements.each
	(
		function(element)
		{
			var a = element.getElement('a');
			
			a.setProperty('href', a.href + '?reference=' + document.location.href);
			
			element.addClass('showed enlarged')
			
			if( $$('#content-container ul').length != 0 )
			{
				var content = $$('#content-container ul')[$$('#content-container ul').length-1];
				element.injectAfter(content);
			}
		}
	);
});


// page prod
window.addEvent('domready', function()
{
	if( ! $(document.body).hasClass('produits') ) return;
	
	var elements = $$('#content-container ul.lvl4');
	
	elements.each
	(
		function(element)
		{
			var a = element.getParent().getElement('a');
			
			a.addClass('static');
			
			a.addEvent
			(
				'click', function(ev)
				{
					new Event(ev).stop();
				}
			);
		}
	);
});


// devis manuel
window.addEvent('domready', function()
{
	if(! $$('div.products-list').length ) return;
	
	var form = $$('form.demande-devis')[0];
	
	var button = form.getElement('button');
	
	var products_list = $$('div.products-list')[0];
	
	var msg = 'Veuillez sélectionner le ou les produits concernés dans la liste ci-dessus.';
	
	products_list.setStyle('display','block');
	
	$$('div.products-list a').setProperty('target','_blank');
	
	$$('div.products-list li ul li:even').addClass('even');
	
	var elements = $$('div.products-list li li a');
	
	var reference = $$('textarea[name=reference]')[0];
	
	reference.setProperties
	({
	 	'readonly': 'readonly'
	})
	.setStyles
	({
		'display': 'none'
	});
	
	var reference_value = reference.value;
	
	var selected = [];
	var labeled = [];
	
	var prodbox = new Element('div',{'class':'prod-box'}).set('html', msg).injectAfter(products_list);
	var prodlabel = new Element('label').set('html', 'Votre sélection : ').injectBefore(prodbox);
	var prodnotice2 = new Element('small').set('html', 'Cliquez sur le label du ou des produits concernés.').injectAfter(products_list);
	var prodnotice3 = new Element('small').set('html', 'Vous pouvez modifier la quantité désirée en éditant la valeur en fin de ligne.').injectAfter(prodbox);
	
	elements.each
	(
		function(element, index)
		{
			if( element.getParent().getElement('ul') )
			{
				element.addClass('category');
				return;
			}
			
			var clone = element.clone().setProperty('title','Consulter la fiche détaillée').addClass('clone').injectAfter(element);
			
			element.set('html', /*element.getParent().getParent().getParent().getElement('span').innerHTML + ' > ' + */element.innerHTML);
			
			element.setProperty('rel','1')
			
			element.addEvent
			(
				'click', function(ev)
				{
					new Event(ev).stop();
					
					if( element.hasClass('selected') )
					{
						element.removeClass('selected');
						var a = selected.indexOf(element.href);
						selected[a] = null;
						labeled[a] = null;
					}
					else
					{
						selected.push( element.href );
						labeled.push( element );
						element.addClass('selected');
					}
					
					prodbox.set('html', '');
					
					var l_clean = labeled.clean();
					
					if( l_clean.length == 0 )
					{
						prodbox.set('html', msg);
					}
					else
					{
						l_clean.each
						(
							function(lbl)
							{
								var rel;
								
								elements.filter('[class=selected]').each
								(
									function(sel)
									{
										if( sel.href == lbl.href ) rel = sel.rel;
									}
								);
								
								var bloc = new Element('div',{'class':'deletable'}).inject(prodbox);
								var bloc_l = new Element('div',{'class': 'bloc-left'}).inject(bloc);
								var bloc_r = new Element('div',{'class': 'bloc-right'}).inject(bloc);
								var a = lbl.clone().inject(bloc_l);
								new Element('label').set('html','Quantité : ').inject(bloc_r);
								var qte = new Element('input',{'class': 'qte', 'type': 'text', 'value': rel}).inject(bloc_r);
								var del = new Element('span',{'class': 'del'}).set('html','Supprimer').inject(bloc_r);
								
								qte.addEvents
								({
									'keyup': function(evt)
									{
										element.setProperty('rel', qte.value);
									}
								});
								
								del.addEvents
								({
									'click': function(evt)
									{
										elements.filter('[class=selected]').each
										(
											function(sel)
											{
												if( sel.href == lbl.href ) sel.fireEvent('click', sel);
											}
										);
									}
								});
							}
						);
					}
					
					button.addEvent
					(
						'click', function(eve)
						{
							new Event(eve).stop();
							
							var rows = prodbox.getElements('div.deletable');
							
							rst = [];
							
							rows.each
							(
								function(row,i)
								{
									var designation = row.getElement('a').innerHTML;
									var quantity =  row.getElement('input').value;
									var url = row.getElement('a').href;
									
									var c = '<br /><em>- <a href="' + url + '">' + designation + '</a> [x' + quantity + ']</em>';
									
									if(i==0) rst.push(c);
									else rst.push('\n\n' + c);
								}
							);
							
							reference.setProperty('value', rst);
							
							form.submit();
						}
					);
				}
			);
			
			// autolaunch
			var param = document.location.search;
			param = param.substring(11,param.length);
			
			if( element.href == param )
			{
				if(! element.hasClass('selected') ) element.fireEvent('click', element);
			}
		}
	);
	
});


// media launcher
window.addEvent
(
	'domready', function()
	{
		new MediaBox
		(
			$$('a.media'),
			{
				alone: true
			}
		);
	}
);


function tableNormes()
{
	var tables = $$('table.tableau-normes');
	
	tables.each
	(
		function(table)
		{
			table.addClass('hidden');
			
			var selector = new Element('select',{'class':'type-selector marged'}).injectBefore(table);
			
			var trs = table.getElements('tbody tr');
			
			var td_types = trs.getElement('td');
			
			var types = td_types.getElements('li');
			
			var strings = [];
			
			types.flatten().each
			(
				function(type)
				{
					var inner = type.innerHTML
					strings.push(inner);
				}
			);
			
			strings.sort();
			
			new Element('div',{'class':'box'}).injectBefore(selector).grab(selector);
			new Element('p').set('html', '<strong>Choisissez votre profil dans la liste déroulante ci-dessous.</strong>').injectBefore(selector);
			new Element('label').set('html', 'Vous êtes : ').injectBefore(selector);
			new Element('option',{'value': ''}).set('html', '').inject(selector);
			var button = new Element('button').addClass('submit marged').set('html', 'Valider').injectAfter(selector);
			
			strings.each
			(
				function(string,i)
				{
					if( string != strings[i-1] )
					{
						new Element('option',{'value': string}).set('html', string).inject(selector);
					}
				}
			);
			
			new Element('option',{'value': 'all'}).set('html', 'Voir toutes les normes').inject(selector);
			
			selector.addEvent
			(
				'change', function()
				{
					table.removeClass('hidden');
					
					trs.addClass('hide');
					
					var value = selector.value;
					
					types.each
					(
						function(type, a)
						{
							type.each
							(
								function(t, b)
								{
									if( value == '' )
									{
										table.addClass('hidden');
										return;
									}
									
									var inner = t.innerHTML;
									
									if( value == inner )
									{
										trs[a].removeClass('hide');
									}
									
									if( value == 'all' )
									{
										trs.removeClass('hide');
									}
								}
							)
						}
					);
				}
			);
			
			button.addEvent
			(
				'click', function()
				{
					selector.fireEvent('change');
				}
			);
		}
	);
}


window.addEvent('domready', function()
{
	var column = $('layer-0');	
	var body = $(document.body);	
	var window_h = window.getScrollHeight();	
	$$(body, column).setStyle('height', window_h);
});


window.addEvent('resize', function()
{
	var column = $('layer-0');	
	var body = $(document.body);	
	var window_h = window.getScrollHeight();	
	$$(body, column).setStyle('height', window_h);
});