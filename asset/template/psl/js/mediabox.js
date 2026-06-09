//		
//		Media Box
//		Version 1.5.3
//		www.orealys.com
//		
//		[10.01.05] fixes : initial position, wrong desc;
//		[10.01.04] fixes : images thumbnails;
//		[09.12.30] method load swf;
//		[09.12.29] fixes : resize + screen adapt;
//		[09.12.18] method load mp3 + flv + youtube;
//		[09.12.02] method load ajax pages + fixes;
//		[09.11.23] fixes;
//		[09.10.12] go go go! carousel + method images + pdf;
//		
//		Yet to clean	:	eval ajaxed javascript, this.desc regroup;
//		Yet to fix		:	method anti clickspam;
//		Yet to do		:	print + send friend hook;
//		


var MediaBox = new Class
({
	Implements: [ Options ],
	
 	options:
	{
		overlayOpacity: .5,
		
		alone: false,
		light: false,
		full: false,
		
		cycleDuration: 5000,
		
		initialHeight: 50,
		initialWidth: 50,
		
		pageRatio: 1.4,
		pageFixedWidth: 668,
		pageDefaultHeight: 300,
		
		pdfWidth: 952,
		
		audioHeight: 24,
		audioWidth: 500,
		
		videoHeight: 405,
		videoWidth: 720,
		
		isImageDraggable: true,
		isImageResizable: true,
		
		player: 'player.swf'
	},
	
	initialize: function(elems, options)
	{
		this.setOptions(options);
		
		this.links = $$(elems);
		
		this.links.each
		(
			function(link,i)
			{
				link.addEvent
				(
					'click', function(ev)
					{
						new Event(ev).stop();
						
						this.link = link;
						this.index = i;
						this.new_index = i;
						this.limit = this.links.length;
						
						this.mb_global = new Element('div',{'class':'mb-global'}).inject( $(document.body) );
						
						this.mb_overlay = new Element('div',{'class':'mb-overlay'}).inject( this.mb_global );
						
						this.mb_capsule = new Element('div',{'class':'mb-capsule'}).inject( this.mb_global );
							this.mb_container = new Element('div',{'class':'mb-container'}).inject( this.mb_capsule );
							this.mb_layer = new Element('div',{'class':'mb-layer'}).inject( this.mb_capsule );
							this.mb_close_btn = new Element('div',{'class':'mb-btn close'}).set('html','close').inject( this.mb_capsule );
							this.resize_hdl = new Element('div',{'class':'mb-hdl resize'}).set('html','resize').inject( this.mb_capsule );
							
						this.mb_bars = new Element('div',{'class':'mb-bars'}).inject( this.mb_global );
							
							this.mb_thumbbar = new Element('div',{'class':'mb-thumb-bar'}).inject( this.mb_bars );
								this.mb_thumblist = new Element('ul',{'class':'mb-thumb-list'}).inject( this.mb_thumbbar );
								
							this.mb_descbar = new Element('div',{'class':'mb-desc-bar'}).inject( this.mb_bars );
							
							this.progress_bar =  new Element('div',{'class':'mb-progress-bar'}).inject( this.mb_bars );
								this.mercury =  new Element('div',{'class':'mercury'}).inject( this.progress_bar );
								
							this.mb_contextbar = new Element('div',{'class':'mb-context-bar'}).inject( this.mb_bars );
								this.mb_previous_btn = new Element('div',{'class':'mb-btn previous'}).set('html','previous').inject( this.mb_contextbar );
								this.mb_next_btn = new Element('div',{'class':'mb-btn next'}).set('html','next').inject( this.mb_contextbar );
								this.mb_play_btn = new Element('div',{'class':'mb-btn play'}).set('html','play').inject( this.mb_contextbar );
								this.mb_first_btn = new Element('div',{'class':'mb-btn first'}).set('html','first').inject( this.mb_contextbar );
								this.mb_last_btn = new Element('div',{'class':'mb-btn last'}).set('html','last').inject( this.mb_contextbar );
								this.mb_max_btn = new Element('div',{'class':'mb-btn maximize'}).set('html','maximize').inject( this.mb_contextbar );
						
						this.mb_capsule_drag = new Drag(this.mb_capsule);
						
						this.mb_capsule.makeResizable
						({
							handle: this.resize_hdl,
							
							limit:
							{
								x: [200, false]
							},
							
							onDrag: function()
							{
								this.resizeContent();
							}
							.bind(this)
						});
						
						if( this.links.length == 1 ) this.options.alone == true;
						
						this.buildCarousel();
						
						this.mb_overlay.setStyles({'opacity': this.options.overlayOpacity});
						
						if( this.options.alone )
						{
							$$(this.mb_contextbar, this.progress_bar, this.mb_thumbbar).destroy();
						}
						else
						{
							this.mb_bars.setStyle('padding-top', this.thumb_h);
						}
						
						if( this.options.light ) $$(this.mb_contextbar, this.progress_bar).destroy();
						
						this.mb_overlayFx = new Fx.Morph
						(
							this.mb_overlay,
							{
								link: 'cancel',
								duration: 250,
								transition: 'expo:in:out'
							}
						);
						
						this.mb_thumbbarFx = new Fx.Morph
						(
							this.mb_thumbbar,
							{
								link: 'cancel',
								duration: 500,
								transition: 'expo:in:out'
							}
						);
						
						this.mb_capsuleFx = new Fx.Morph
						(
							this.mb_capsule,
							{
								link: 'cancel',
								duration: 250,
								transition: 'expo:in:out'
							}
						);
						
						this.mb_containerFx = new Fx.Morph
						(
							this.mb_container,
							{
								link: 'cancel',
								duration: 500,
								transition: 'expo:in:out'
							}
						);
						
						this.mercuryFx = new Fx.Morph
						(
							this.mercury,
							{
								unit: '%',
								link: 'cancel',
								duration: this.options.cycleDuration,
								transition: 'linear',
								onComplete: function()
								{
									ev.target = this.mb_next_btn;
									ev.source = 'cycle';
									this.mb_next_btn.fireEvent('click', ev);
								}
								.bind(this)
							}
						);
						
						$$(this.mb_overlay, this.mb_close_btn).addEvent
						(
							'click', function()
							{
								this.destroyContent();
							}
							.bind(this)
						);
						
						$$(this.mb_previous_btn, this.mb_next_btn, this.mb_first_btn, this.mb_last_btn).addEvent
						(
							'click', function(e)
							{
								if(! e.source)
								{
									this.mercuryFx.cancel();
									
									this.mercuryFx.set
									({
										'width': 0
									});
								}
								
								this.target = e.target;
								
								if( this.target.hasClass('previous') )
								{
									this.new_index = this.index - 1;
									if( this.new_index < 0 ) this.new_index = this.limit - 1;
								}
								else if( this.target.hasClass('next') )
								{
									this.new_index = this.index + 1;
									if( this.new_index > this.limit - 1 ) this.new_index = 0;
								}
								else if( this.target.hasClass('first') )
								{
									this.new_index = 0;
								}
								else
								{
									this.new_index = this.limit - 1;
								}
								
								this.link = this.links[this.new_index];
																
								this.display( this.link.href );
								
								this.index = this.new_index;
							}
							.bind(this)
						);
						
						this.mb_play_btn.addEvent
						(
							'click', function(e)
							{
								if( this.isCycling )
								{
									this.stopCycling();
									return;
								}
								
								this.startCycling(e);
							}
							.bind(this)
						);
						
						this.mb_layer.addEvent
						(
							'dblclick', function(e)
							{
								if( this.isAdapted )
								{
									this.restoreContent();
								}
								else
								{
									this.adaptContent();
								}
							}
							.bind(this)
						);
						
						this.mb_max_btn.addEvent
						(
							'click', function(e)
							{
							}
							.bind(this)
						);
						
						this.resize_hdl.addEvents
						({
							'mouseenter': function()
							{
								this.allowDrag(false);
							}
							.bind(this),
							
							'mouseleave': function()
							{
								this.allowDrag(true);
							}
							.bind(this)
						});
						
						/*
						$(document.body).addEvents
						({
							'keydown': function(e)
							{
								var key = e.key;
								
								if( key == 'left' )
								{
									e.target = this.mb_previous_btn;
									//this.mb_previous_btn.fireEvent('click', e);
								}
								else if( key == 'right' )
								{
									e.target = this.mb_next_btn;
									//this.mb_next_btn.fireEvent('click', e);
								}
								else if( key == 'esc' )
								{
									this.mb_overlay.fireEvent('click');
								}
							}
							.bind(this)
						});
						*/
						
						$(window).addEvents
						({
							'resize': function(e)
							{
								this.adaptContent();
							}
							.bind(this)
						});
						
						this.h = this.options.initialHeight;
						this.w = this.options.initialWidth;
						this.r = this.options.pageRatio;
						this.pt = this.mb_capsule.getStyle('padding-top').toInt();
						this.pb = this.mb_capsule.getStyle('padding-bottom').toInt();
						this.bt = this.mb_capsule.getStyle('border-top-width').toInt();
						this.bb = this.mb_capsule.getStyle('border-bottom-width').toInt();
						this.pl = this.mb_capsule.getStyle('padding-left').toInt();
						this.pr = this.mb_capsule.getStyle('padding-right').toInt();
						this.bl = this.mb_capsule.getStyle('border-left-width').toInt();
						this.br = this.mb_capsule.getStyle('border-right-width').toInt();
						
						this.focusContent('set');
						
						this.display(this.link.href);
					}
					.bind(this)
				);
			},
			this
		);
	},
	
	buildCarousel: function()
	{
		this.thumbs = [];
					
		this.links.each
		(
			function(element,j)
			{
				var src = this.links[j].href;
				
				var type = this.returnType(src);
				
				var thumb_content = new Element('span').set('html', this.returnDesc(element) );
				
				var thumb = new Element('li').addClass(type).grab(thumb_content).inject(this.mb_thumblist);
				
				if( type == 'image' )
				{
					thumb.setStyle('background-image','url(' + element.getElement('img').src + ')');
					thumb_content.set('html','');
				}
				
				if( type == 'youtube' )
				{
					var query = this.returnQuery(src);
					var thumb_src = 'http://img.youtube.com/vi/' + query.v + '/default.jpg';
					thumb_content.set('html','');
					thumb.setStyle('background-image','url(' + thumb_src + ')');
				}
				
				this.thumbs.push(thumb);
				
				thumb.addEvent
				(
					'click', function()
					{
						this.link = element;
						this.new_index = j;
						if( this.new_index == this.index ) return;
						this.index = this.new_index;
						this.display(src);
					}
					.bind(this)
				);
			}
			,this
		);
		
		this.thumb_w = this.mb_thumblist.getElement('li').getCoordinates().width + this.mb_thumblist.getElement('li').getStyle('margin-right').toInt();
		this.mb_thumblist.setStyle('width', this.thumb_w * this.limit);
		this.thumb_h = this.mb_thumblist.getCoordinates().height + this.mb_thumblist.getStyle('margin-top').toInt() + this.mb_thumblist.getStyle('margin-bottom').toInt();
	},
	
	display: function(src)
	{
		this.type = this.returnType(src);
		
		this.allowDrag(false);
		this.allowResize(false);
		this.isAdapted = false;
		this.mb_layer.removeClass('visible');
		this.mb_container.removeClass('image');
		this.mb_container.set('html','');
		this.mb_descbar.removeClass('hide');
		
		if( this.pdfembed )
		{
			if(! this.pdfembed.hasClass('destroyed') )
			{
				this.pdfembed.addClass('destroyed');
				this.destroyContent();
				this.link.fireEvent('click', this.link);
				this.scrollThumbs('direct');
			}
			else
			{
				this.scrollThumbs();
			}
		}
		else
		{
			this.scrollThumbs();
		}
		
		this.scrollThumbs();
		
		if( this.type != 'image' ) this.stopCycling();
		
		switch(this.type)
		{
			case 'page':
			this.displayPage(src);
			break;
			
			case 'pdf':
			this.displayPdf(src);
			break;
			
			case 'image':
			this.displayImage(src);
			break;
			
			case 'audio':
			this.displayAudio(src);
			break;
			
			case 'video':
			case 'youtube':
			this.displayVideo(src);
			break;
			
			case 'swf':
			this.displaySwf(src);
			break;
			
			default:
			this.displayError(src);
			break;
		}
		
		this.desc = this.returnDesc(this.link);
	},
	
	scrollThumbs: function(modifier)
	{
		if( modifier == 'direct' )
		{
			this.mb_thumbbarFx.set
			({
				'margin-left': (- this.thumb_w * this.new_index ) - this.thumb_w / 2
			});
		}
		else
		{
			this.mb_thumbbarFx.start
			({
				'margin-left': (- this.thumb_w * this.new_index ) - this.thumb_w / 2
			});
		}
		
		this.thumbs[this.index].removeClass('selected');
		this.thumbs[this.new_index].addClass('selected');
	},
	
	displayImage: function(src)
	{
		if( this.state == 1 )
		{
			this.new_index = this.index;
			return;
		}
		
		this.state = 1;
		
		this.mb_container.addClass('image');
		this.mb_layer.addClass('visible');
		
		this.allowDrag(this.options.isImageDraggable);
		this.allowResize(this.options.isImageResizable);
		
		this.mb_container.setStyles
		({
			'opacity': 0
		});
		
		this.image = new Asset.image
		(
			src,
			{
				onload: function()
				{
					this.w = this.image.getProperty('width').toInt();
					this.h = this.image.getProperty('height').toInt();
					
					this.w0 = this.w;
					this.h0 = this.h;
					
					this.r = this.w / this.h;
					
					this.image.removeProperties('width','height').inject(this.mb_container);
					
					this.isAdapted = false;
					
					if( this.h + ( this.pt*2+this.pb*2+this.bt+this.bb ) > ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) )
					{
						this.h = ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) - ( this.pt*2+this.pb*2+this.bt+this.bb );
						this.w = this.h * this.r;
						this.isAdapted = true;
					}
					
					this.focusContent();
				}
				.bind(this)
			}
		);
		
		this.mb_capsuleFx.onComplete =
		(
			function()
			{
				this.mb_containerFx.start
				({
					'opacity': 1
				})
				.chain
				(
					function()
					{
						this.state = 0;
						if( this.isCycling ) this.cycle();
					}
					.bind(this)
				);
				
				this.mb_capsuleFx.onComplete = $empty;
			}
			.bind(this)
		);
	},
	
	displayPdf: function(src)
	{
		this.src = src;
		
		this.h = ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) - ( this.pt*2+this.pb*2+this.bt+this.bb );
		this.w = this.options.pdfWidth;
		
		if( this.options.pdfWidth == 0 ) this.w = this.mb_bars.getCoordinates().width - ( this.pl*2+this.pr*2+this.bl+this.br );
		
		this.focusContent();
		
		this.mb_capsuleFx.onComplete =
		(
			function()
			{
				this.pdfembed = new Element('div',{'class':'pdfembed'}).removeClass('destroyed').set('html','<embed src="' + this.src + '" width="100%" height="100%"></embed><p class="alert"><strong><a href="' + this.src + '" target="_blank">Téléchargez directement ce document si celui-ci ne s\'ouvre pas.</a></strong></p>');
				this.mb_container.grab(this.pdfembed);
				
				this.mb_capsuleFx.onComplete = $empty;
			}
			.bind(this)
		);
	},
	
	displayPage: function(src)
	{
		this.h = this.options.pageDefaultHeight;
		
		if( this.options.full ) this.h = ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) - ( this.pt*2+this.pb*2+this.bt+this.bb );
		
		this.w = this.h / this.r;
		
		if( this.options.pageFixedWidth != 0 ) this.w = this.options.pageFixedWidth;
		
		this.mb_container.set
		(
			'load',
			{
				onComplete: function()
				{
					this.checkContent();
					
					// clean that
					var media_0 = new MediaBox
					(
						$$('#popup-container a.media'),
						{
							alone: true
						}
					);
					
					var media_1 = new MediaBox
					(
						$$('#popup-container ul.groupe-photo a')
					);
					
					window.addEvent
					(
						'domready', function()
						{
							var elements = $$('#popup-container h4.titre-detail');
							
							elements.each
							(
								function(element)
								{
									var layer = new Element('span',{'class':'layer'});
									var content = element.innerHTML;
									element.set('html','');
									layer.set('html', content).inject(element)
								}
							);
						}
					);
					//
				}
				.bind(this)
			}
		);
		
		this.mb_container.load(src);
		
		this.focusContent();
	},
	
	displayExternalPage: function(src)
	{
	},
	
	displayAudio: function(src)
	{
		this.src = src;
		
		var context = $(document).getElement('head link').href;
		context = context.split('/');
		context.each
		(
			function(part, index)
			{
				if( part == 'template' )
				{
					this.path = part + '/' + context[index+1] + '/img/mediabox-assets/' + this.options.player;
				}
			}
			,this
		);
		
		this.h = this.options.audioHeight;
		this.w = this.options.audioWidth;
		
		this.focusContent();
		
		this.mb_capsuleFx.onComplete =
		(
			function()
			{
				this.player = new Swiff
				(
					this.path,
					{
						container: this.mb_container,
						height: this.h,
						width: this.w,
						params:
						{
							wmode: 'transparent'
						},
						vars:
						{
							file : this.src
						}
					}
				);
				
				this.mb_capsuleFx.onComplete = $empty;
			}
			.bind(this)
		);
	},
	
	displayVideo: function(src)
	{
		this.src = src;
		
		var context = $(document).getElement('head link').href;
		context = context.split('/');
		context.each
		(
			function(part, index)
			{
				if( part == 'template' )
				{
					this.path = part + '/' + context[index+1] + '/img/mediabox-assets/' + this.options.player;
				}
			}
			,this
		);
		
		this.h = this.options.videoHeight;
		this.w = this.options.videoWidth;
		
		this.thumb_src = '';
		
		if( this.type == 'youtube' )
		{
			var query = this.returnQuery(this.src);
			this.thumb_src = 'http://img.youtube.com/vi/' + query.v + '/hqdefault.jpg';
		}
		
		this.focusContent();
		
		this.mb_capsuleFx.onComplete =
		(
			function()
			{
				this.player = new Swiff
				(
					this.path,
					{
						container: this.mb_container,
						height: this.h,
						width: this.w,
						params:
						{
							wmode: 'transparent',
							allowfullscreen: true
						},
						vars:
						{
							file : this.src,
							image : this.thumb_src
						}
					}
				);
				
				this.mb_capsuleFx.onComplete = $empty;
			}
			.bind(this)
		);
		
	},
	
	displaySwf: function(src)
	{
		this.params = this.returnRel(this.link.rel);
		
		this.h = this.params.y.toInt();
		this.w = this.params.x.toInt();
		
		this.mb_capsuleFx.start
		
		this.object = new Swiff
		(
			src,
			{
				container: this.mb_container,
				width: '100%',
				height: '100%'
			}
		);
		
		this.focusContent();
	},
	
	displayError: function(src)
	{
		if( src.match('.php') )
		{
			this.type = 'page';
			this.displayPage(src);
			return;
		}
		
		var ext = src.substr(src.length-3, src.length);
		
		this.desc = '<strong>Format non-supporté | Extension détectée : ' + ext + '</strong><br />' + src;
		
		this.mb_descbar.set('html', this.desc);
		
		this.mb_container.set('html', this.desc);
		
		this.h = this.options.pageDefaultHeight;
		this.w = this.options.pageFixedWidth;
		
		this.focusContent();
	},
	
	checkContent: function()
	{
		if( this.options.full ) return;
		
		this.routine =
		(
			function()
			{
				this.adaptContent();
			}
			.bind(this)
		)
		.periodical(250);
	},
	
	adaptContent: function()
	{
		this.isAdapted = true;
		
		this.h = ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) - ( this.pt*2+this.pb*2+this.bt+this.bb );
		this.w = this.mb_bars.getCoordinates().width - ( this.pl*2+this.pr*2+this.bl+this.br );
		
		if( this.type == 'image' )
		{
			if( this.h0 < this.h ) this.h = this.h0;
			this.w = this.h * this.r;
		}
		
		if( this.type == 'page' )
		{
			this.w = this.h / this.r;
			if( this.options.pageFixedWidth != 0 ) this.w = this.options.pageFixedWidth;
		}
		
		if( this.type == 'pdf' )
		{
			if( this.w > this.options.pdfWidth ) this.w = this.options.pdfWidth;
		}
		
		if( this.type == 'audio' )
		{
			this.h = this.options.audioHeight;
			this.w = this.options.audioWidth;
		}
		
		if( this.type == 'video' || this.type == 'youtube' )
		{
			this.h = this.options.videoHeight;
			this.w = this.options.videoWidth;
		}
		
		if( this.type == 'swf' )
		{
			this.h = this.params.y.toInt();
			this.w = this.params.x.toInt();
		}
		
		if( this.type == 'page' && this.options.full == false )
		{
			if(! this.mb_container.getElement('div')) return;
			
			this.popup_container = this.mb_container.getElement('div');
			
			this.popup_content_h = this.popup_container.getCoordinates().height;
			
			if( this.popup_content_h + ( this.pt*2+this.pb*2+this.bt+this.bb ) < ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) )
			{
				this.h = this.popup_content_h;
				this.popup_container.removeClass('scrollable');
			}
			else
			{
				this.popup_container.addClass('scrollable');
			}
		}
		
		this.focusContent();
	},
	
	restoreContent: function()
	{
		this.isAdapted = false;
		
		if( this.type != 'image' )
		{
			this.adaptContent();
			return;
		}
		
		this.w = this.w0;
		this.h = this.h0;
		
		this.focusContent();
	},
	
	focusContent: function(modifier)
	{
		this.mt = - (this.h+this.pt+this.pb+this.bt+this.bb) / 2;
		this.ml = - (this.w+this.pl+this.pr+this.bl+this.br) / 2;
		this.t = ( window.getCoordinates().height - this.mb_bars.getCoordinates().height ) / 2;
		this.l = this.mb_bars.getCoordinates().width / 2;
		
		if( modifier == 'set' )
		{
			this.mb_capsule.setStyles
			({
				'width': this.w,
				'height': this.h,
				'top': this.t,
				'left': this.l,
				'margin-top': this.mt,
				'margin-left': this.ml
			});
		}
		else
		{
			this.mb_capsuleFx.start
			({
				'width': this.w,
				'height': this.h,
				'top': this.t,
				'left': this.l,
				'margin-top': this.mt,
				'margin-left': this.ml
			});
		}
	},
	
	resizeContent: function()
	{
		if( this.type == 'image' )
		{
			var h = this.mb_container.getCoordinates().width / this.r;
			
			this.mb_capsule.setStyles
			({
				'height': h
			});
		}
	},
	
	destroyContent: function()
	{
		this.type = '';
		this.mb_global.destroy();
		this.stopCycling();
		$clear(this.routine);
		$(window).removeEvents('resize');
	},
	
	startCycling: function(e)
	{
		this.isCycling = true;
		
		this.mb_play_btn.addClass('running');
		
		this.mb_overlayFx.start
		({
			'opacity': 1
		});
		
		this.cycle();
	},
	
	stopCycling: function()
	{
		this.isCycling = false;
		
		this.mb_play_btn.removeClass('running');
		
		this.mb_overlayFx.start
		({
			'opacity': this.options.overlayOpacity
		});
		
		this.mercuryFx.cancel();
		
		this.mercuryFx.set
		({
			'width': 0
		});
		
		$clear(this.periodical);
	},
	
	cycle: function()
	{
		this.mercuryFx.set
		({
			'width': 0
		});
		
		this.mercuryFx.start
		({
			'width': 100
		});
	},
	
	allowResize: function(s)
	{
		if(s)
		{
			this.mb_capsule.addClass('resizable');
		}
		else
		{
			this.mb_capsule.removeClass('resizable');
		}
	},
	
	allowDrag: function(s)
	{
		if(s)
		{
			this.mb_capsule_drag.attach();
			this.mb_capsule.addClass('draggable');
		}
		else
		{
			this.mb_capsule_drag.detach();
			this.mb_capsule.removeClass('draggable');
		}
	},
	
	returnType: function(src)
	{
		var ext = src.substr(src.length-3, src.length);
		
		if( src.match('youtube') ) ext = 'youtube';
		
		var type;
		
		switch(ext)
		{
			case 'php':
			case 'tml':
			case 'htm':
			case 'asp':
			type = 'page';
			break;
			
			case 'pdf':
			type = 'pdf';
			break;
			
			case 'jpg':
			case 'gif':
			case 'png':
			case 'bmp':
			case 'JPG':
			case 'GIF':
			case 'PNG':
			case 'BMP':
			type = 'image';
			break;
			
			case 'mp3':
			type = 'audio';
			break;
			
			case 'flv':
			type = 'video';
			break;
			
			case 'youtube':
			type = 'youtube';
			break;
			
			case 'swf':
			type = 'swf';
			break;
				
			default:
			type = 'unknown';
			break;
		}
		
		return type;
	},
	
	returnQuery: function(src)
	{
		var query = src.split('?')[1].split('&');
		
		var params = [];
		var values = [];
		
		query.each
		(
			function(param)
			{
				params.push(param.split('=')[0]);
				values.push(param.split('=')[1]);
			}
		);
		
		query = values.associate(params);
		
		return query;
	},
	
	returnRel: function(rel)
	{
		rel = rel.split(' ');
		
		var params = [];
		var values = [];
		
		rel.each
		(
			function(param)
			{
				params.push(param.split(':')[0]);
				values.push(param.split(':')[1]);
			}
		);
		
		rel = values.associate(params);
		
		return rel;
	},
	
	returnDesc: function(element)
	{
		this.mb_descbar.removeClass('hide')
		
		var desc = element.getProperty('title');
		
		if( desc == '' || !desc ) desc = element.innerHTML;
		
		if( this.type == 'image' )
		{
			desc = element.getElement('img').getProperty('alt');
		}
		
		if( desc == '' ) this.mb_descbar.addClass('hide');
		
		this.mb_descbar.set('html', desc);
		
		return desc;
	}
});


function openThis(url)
{
	var link = new Element('a',{'href': url});
	
	new MediaBox
	(
		link,
		{
			'alone': true
		}
	);
	
	link.fireEvent('click', link);
}