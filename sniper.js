var Simple = Simple || {};
(function(S) {
	// #id,.class,tag,[attr=value]
	var quickMatch = /^[\w[:#.][\w-\]*^|=!]*$/,
	// input[type~="text"] ==> input,type,~,text
	quickAttrMatch = /^(.*)(\[(\w+)([\*~\$\^\!]?=)[\"\']?([\w\s-]*)[\"\']?\])$/,
	// tag,id,class,attr,attrFlag,attrValue,pseudoName,pseudoIndex
	selectorAllMatch = /([^[:.#]+)?(?:#([^[:.#]+))?(?:\.([^[:.]+))?(?:\[([^!&^*~|$\][:=]+)([!~$^*|&]?)=?([^:\]]+)?\])?(?:\:([^\:(]+)(?:\(([^)]+)\))?)?/, queryCache = {};
	// 循環
	if (!S.each) {
		S.each = function(object, callback, context) {
			var name, i = 0, length = object.length;
			if (length === undefined) {
				for (name in object) {
					if (callback.call(context || object[name], object[name], name) === false) {
						break;
					}
				}
			} else {
				for (var value = object[0]; i < length && callback.call(context || object[name], value, i) !== false; value = object[++i]) {
				}
			}
			return object;
		}
	}
	S.error = function(msg) {
		if (window.console && console.log) {
			console.log(msg);
			throw new Error(msg);
		}
	}
	if (!S.dom) {
		S.dom = {
			byId : function(id) {

				var node = document.getElementById(id);
				// fix IE7,6 下可能取出的是表单元素name的值
				return node;
			},
			byTag : function(tagName, context) {
				context = context || document;
				tagName = tagName || '*';
				return context.getElementsByTagName(tagName);
			},
			byCls : function(klass, tag, context) {
				if (!klass) {
					S.log('S.dom: please give S.dom.byCls an className!');
					return;
				}
				var res = [], nodeList;
				context = context || document;
				if (document.getElementsByClassName) {
					nodeList = context.getElementsByClassName(klass);
					if (!tag) {
						return nodeList;
					}
					for (var i = 0, j = nodeList.length; i < j; i++) {
						if (nodeList[i].tagName.toLowerCase() == tag) {
							res.push(nodeList[i]);
						}
					}

				} else {
					nodeList = S.dom.byTag(tag, context);
					for (var i = 0, j = nodeList.length; i < j; i++) {

						if (S.dom.hasClass(nodeList[i], klass)) {
							res.push(nodeList[i]);
						}
					}
				}
				return res;
			},
			next : function(node) {
				do {
					node = node.nextSibling;
				} while(node && node.nodeType !=1);
				return node;
			},
			prev : function(node) {
				do {
					node = node.previousSibling;
				} while(node && node.nodeType !=1);
				return node;
			},
			getText : function(node) {
				return node.textContent || node.innerText || '';
			},
			contains : function(parentNode, child) {

				if (parentNode.compareDocumentPosition) {
					return !!(parentNode.compareDocumentPosition(child) & 16);
				} else if (parentNode.contains) {
					// IE下会认为自身包含自身
					return parentNode !== child && (parentNode.contains ? parentNode.contains(child) : true);
				}
				while (( child = child.parentNode)) {
					if (parentNode === child) {
						return true;
					} else {
						return false;
					}
				}
			},
			hasClass : function(node, className) {
				var clsName = node.className;
				return new RegExp(className).test(clsName);
			},
			getAttr : function(node, attr) {
				return node.getAttribute(attr);
			}
		}
	}
	// util
	if (!S.util) {
		S.util = {};
		if (!S.util.flatten) {
			S.util.flatten = function(arr) {
				var res = [];
				(function(arr) {
					for (var i = 0; i < arr.length; i++) {
						if (arr[i].length) {
							// 递归调用
							arguments.callee(arr[i]);
						} else {
							res.push(arr[i]);
						}
					}
				})(arr);
				return res;
			}
		}

		var toArray = Array.slice ||
		function(nodes) {
			return Array.prototype.slice.call(nodes);
		};

		try {
			toArray(document.documentElement.childNodes);
		} catch (e) {
			toArray = function(nodes) {
				if ( nodes instanceof Array)
					return nodes;
				var i = nodes.length, results = new Array(i);
				while (i--)
				results[i] = nodes[i];
				return results;
			};
		}

		if (!S.util.makeArray) {
			S.util.makeArray = toArray;
		}
	}
	S.query = function(selector, context) {
		var result = [], node;
		context = context || document;
		// 首先从缓存中读取
		//if (queryCache[selector]) {
		//return queryCache[selector];
		//}
		result = query(selector, context);
		result.selector = selector;
		//queryCache[selector] = result;
		return result;
	}
	S.filter = function(nodeList, selector) {
		var result = [];
		if (nodeList.selector) {
			selector = nodeList.selector + ' ' + selector;
			result = S.query(selector);
		} else {
			if (nodeList.length == 1) {
				result = S.query(selector, nodeList[0]);
			} else {
				S.log('不支持手动获取的NodeList!');
			}
		}

		return result;
	}
	var _matchSelector = function(matchNodeItem, expr, index) {
		var matchClass = true, matchPseudo = true, matchAttr = true;

		if (expr.className.length) {
			S.each(expr.className, function(klass) {
				if (!S.dom.hasClass(matchNodeItem, klass)) {
					matchClass = false;
					return false;
				}
			});
		}
		if (expr.attr.length) {
			S.each(expr.attr, function(attr) {
				if (!filter.byAttrMatch(matchNodeItem, attr.name, attr.value, attr.flag)) {
					matchAttr = false;
					return false;
				}
			});
		}

		if (expr.pseudo.length) {
			S.each(expr.pseudo, function(pseudo) {
				if (!S.query.pseudo[pseudo.name]) {
					S.error('S.query: ' + pseudo.name + ' is not supported!');
				}
				if (!S.query.pseudo[pseudo.name](matchNodeItem, index, pseudo.index)) {
					matchPseudo = false;
					return false;
				}

			}, this);
		}
		return (!expr.id || matchNodeItem.id == expr.id) && (!expr.className.length || matchClass) && (!expr.attr.length || matchAttr) && (!expr.pseudo.length || matchPseudo) && (!expr.tagName || matchNodeItem.tagName.toLowerCase() == expr.tagName);
	}
	S.match = function(node, selector) {
		var nodeList = S.util.makeArray(S.query(selector)), isMatch = false;
		S.each(nodeList, function(nodeItem, nodeIndex) {
			if (node == nodeItem) {
				isMatch = true;
				return false;
			}
		})
		//return _matchSelector(node, selector);
		return isMatch;
	}

	S.query.implement = function(name, props) {
		S.query[name] = S.query[name] || {};
		S.each(props, function(item, key) {
			S.query[name][key] = item;
		});
	}
	/**
	 * 解析单个css表达式
	 * div.class1.class2.class3[type="text"]["data-type"="cc"]:nth-child(2n+1) ==>
	 * {
	 * 	tagName:div,
	 * 	id:'',
	 *  className:['class1','class2','class3'],
	 *  attr:[{
	 * 		name:'type',
	 * 		value:'text'
	 * },{
	 * 		name:'data-type',
	 * 		value:'cc'
	 * }],
	 * pseudo:[{
	 * 	name:'nth-child',
	 *  index:'2n+1'
	 * }]
	 * }
	 */
	var getMatchExpr = function(selector) {
		var expr = {
			tagName : '',
			id : '',
			className : [],
			attr : [],
			pseudo : []
		}, match;
		while (( match = selector.match(selectorAllMatch)) && match[0]) {
			if (match[1]) {
				expr.tagName = match[1];
				selector = selector.replace(match[1], '');
			}
			if (match[2]) {
				expr.id = match[2];
				selector = selector.replace('#' + match[2], '');
			}
			if (match[3]) {
				expr.className = expr.className || [];
				expr.className.push(match[3]);
				selector = selector.replace('.' + match[3], '');

			}
			if (match[4]) {
				expr.attr = expr.attr || [];
				var flag = '', value = '';
				if (match[5]) {
					flag = match[5];
				}
				if (match[6]) {
					value = '=' + match[6];
				}
				expr.attr.push({
					name : match[4],
					value : match[6],
					flag : flag || ' '
				});

				selector = selector.replace('[' + match[4] + flag + value + ']', '');
			}
			if (match[7]) {
				expr.pseudo = expr.pseudo || [];
				expr.pseudo.push({
					name : match[7],
					index : match[8]
				});
				var index = '';
				if (match[8]) {
					index = '(' + match[8] + ')';
				}
				selector = selector.replace(':' + match[7] + index, '');
			}
		}

		return expr;

	}
	/**
	 * 分割CSS表达式
	 * @method parseSelector
	 * @param selector {String} 传入的表达式
	 * @return res {Array} 返回解析后的数组
	 */
	S.parseSelector = function(selector) {
		var result = [], maxWarnCount = 3, count = 0;
		// 去除+,>,~之间的空格，为了保持兼容性
		// div + p ==> div+p
		// div+ p ==> div+p
		// div +p ==> div+p
		selector = selector.replace(/\s*([\+~>]+)\s*/g, '$1');
		do {
			selector = selector.replace(/^(.+)([\+\>~\s])(?![\d=])(.+)$/, function(select, normalex, separator, normal) {
				var separatorExpr = getMatchExpr(normal);
				separatorExpr.separator = separator;
				result.push(separatorExpr);
				return normalex;
			});
			count++;
		} while (/^(.+)([\+\>~\s])(?![\d=])(.+)$/.test(selector));
		result.push(getMatchExpr(selector));
		if (count >= maxWarnCount) {
			throw new error('你所使用的选择器层级超过3层嵌套，性能低下，请更换！');
		}
		return result;
	}
	var query = function(selector, context) {
		// 快速匹配简单选择器
		if (quickMatch.test(selector)) {
			var marker = selector.charAt(0), selectorValue = selector.slice(1), node, result;
			switch (marker) {
				case '#':
					node = S.dom.byId(selectorValue);
					result = node ? [node] : [];
					break;
				case '.':
					node = S.dom.byCls(selectorValue, null, context);
					result = node;
					break;
				case ':':
					var index = selector.replace(/[^(]*\(([^)]*)\)/, "$1"), pseudoName = selector.replace(/\(.*/, '');
					result = filter.byPseudo(pseudoName.slice(1), '*', index, context);
					break;
				case '[':
					var match = selector.match(quickAttrMatch), attr = match[3], value = match[5], flag = match[4];
					result = filter.byAttr(attr, value, '*', flag, context);
					break;
				default :
					result = S.dom.byTag(selector, context);
			}
		} else {
			// 否则尝试使用querySelectorAll;
			try {
				//TODO:fix ie8 querySelectAll 错误实现
				result = context.querySelectorAll(selector);
			} catch (e) {
				//否则使用实现的query
				// 开始匹配选择器
				result = filter.init(selector, context);
			}
		}
		return result;
	}
	var filter = {
		init : function(selector, context) {
			var result = [];
			// 检查是否是多选择器
			selector = selector.split(/\s*,\s*/);
			S.each(selector, function(expr) {
				var nodeList = filter._query(expr, context);
				result = result.concat(nodeList);
			});
			result = S.util.flatten(result);
			return result;
		},
		_query : function(expr, context) {
			var selector, childList, separator, count = 0;
			selector = S.parseSelector(expr);
			for (var i = 0; i < selector.length; i++) {
				if (selector[i - 1] && selector[i - 1].separator) {
					separator = selector[i - 1].separator;
				}
				//separator = selector[i].separator;
				childList = filter.getNode(selector[i], childList, separator, i, context);
				//count++;
				if (!childList.length) {
					break;
				}
			}
			return childList;
		},
		getNode : function(selector, childList, separator, depth, context) {

			var node, nodeList, expr = selector, result = [];
			if (childList) {
				nodeList = childList;
			} else {
				// 根据tag找出元素的最大集合
				nodeList = S.util.makeArray(S.dom.byTag(selector.tagName, context));

			}

			// 开始匹配
			S.each(nodeList, function(nodeItem, nodeIndex) {
				var matchNode, index, isMatch = false;
				// 父级
				if (separator) {
					matchNode = S.query.separator[separator](nodeItem, depth);
					loop:
					for (var j = 0; j < matchNode.length; j++) {
						if (_matchSelector.call(matchNode, matchNode[j], selector, j)) {
							isMatch = true;
							break loop;
						}
					}
				} else {
					matchNode = [nodeItem];
					isMatch = _matchSelector.call(matchNode, nodeItem, selector, nodeIndex);
				}

				if (isMatch) {
					result.push(nodeItem);
				}
			});

			return result;
		},
		byPseudo : function(pseudoName, tagName, number, context) {
			var result = [], nodeList = S.util.makeArray(S.dom.byTag(tagName, context));
			S.each(nodeList, function(node, index) {
				if (S.query.pseudo[pseudoName](node, index, number)) {
					result.push(node);
				}
			});
			return result;
		},
		byAttr : function(attr, value, tagName, flag, context) {
			var result = [], nodeList, flag = flag || ' ';
			nodeList = S.util.makeArray(S.dom.byTag(tagName, context));
			S.each(nodeList, function(node, index) {
				if (filter.byAttrMatch(node, attr, value, flag)) {
					result.push(node);
				}
			});
			return result;
		},
		byAttrMatch : function(node, attr, value, flag) {
			var attrValue = S.dom.getAttr(node, attr);

			return S.query.attr[flag](attrValue, value);
		}
	}
	/*from right to left*/
	S.query.implement('separator', {
		' ' : function(node) {

			var result = [];
			while (node.parentNode && node.parentNode != document) {
				node = node.parentNode;
				result.push(node);
			}
			return result;
		},
		'+' : function(node, depth) {

			for (var i = 0; i < depth; i++) {
				if (node) {
					node = S.dom.prev(node);
				} else {
					break;
				}
			}

			return node ? [node] : [];
		},
		'>' : function(node, depth) {
			for (var i = 0; i < depth; i++) {
				node = node.parentNode;
			}

			return node && node != document ? [node] : [];
		},
		'~' : function(node, depth) {
			for (var i = 0; i < depth; i++) {
				if (node) {
					node = S.dom.prev(node);
				} else {
					break;
				}
			}
			return node ? [node] : [];
		}
	});
	S.query.implement('attr', {
		// 匹配单词的部分包含testValue的语句
		'*' : function(value, testValue) {
			return new RegExp('^.*' + testValue + '.*$').test(value);
		},
		// 匹配单词的开始包含testValue的语句
		'^' : function(value, testValue) {
			return new RegExp('^' + testValue + '.*').test(value);
		},
		// 匹配单词的结束包含testValue的语句
		'$' : function(value, testValue) {
			return new RegExp('.*' + testValue + '$').test(value);
		},
		// 匹配包含testValue的语句，应该有空格隔开
		'~' : function(value, testValue) {
			return new RegExp('\s*' + testValue + '\s*').test(value);
		},
		' ' : function(value, testValue) {
			if (!testValue && value) {
				return true;
			}
			return value === testValue;
		},
		'!' : function(value, testValue) {
			return value !== testValue;
		},
		// 匹配包含testValue的语句，应该有-隔开
		'|' : function(value, testValue) {
			return new RegExp('-*' + testValue + '-*').test(value);
		}
	});
	S.query.implement('pseudo', {
		'checked' : function(node) {
			return node.checked;
		},
		'contains' : function(node, index, text) {
			var allText = S.dom.getText(node);
			return allText.indexOf(text) != -1;
		},
		'disabled' : function(node) {
			return node.disabled;
		},
		'empty' : function(node) {
			return !node.firstChild;
		},
		'even' : function(node, index) {
			return index % 2 === 0;
		},
		'first-child' : function(node) {
			return node.parentNode.getElementsByTagName('*')[0] === node;
		},
		'gt' : function(node, index, number) {
			return index > number;
		},
		'input' : function(node) {
			return node.tagName.toLowerCase == 'input';
		},
		/*'last-child' : function(node) {

		 },*/
		'lt' : function(node, index, number) {
			return index < number;
		},
		'not' : function(node, index, selector) {
			return !S.match(node, selector);
		},
		/*'nth-child' : function(node, index, n) {
		 if (n == 'odd') {
		 //return this.odd(node, index);
		 }
		 if (n == 'even') {
		 //return this.even(node, index);
		 }
		 },
		 'odd' : function(node, index) {
		 return index % 2 === 1;
		 },
		 'only-child' : function(node) {

		 },*/
		'parent' : function(node) {
			return !!node.firstChild;
		}
	});
	S.each(['text', 'radio', 'checkbox', 'button', 'reset', 'file', 'submit', 'password', 'image', 'hidden'], function(item) {
		S.query.pseudo[item] = function(node) {
			return node.getAttribute('type') == item;
		}
	});
})(Simple);
