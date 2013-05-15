Sniper
======

* version 0.1 2012-08-17

一个简单的CSS选择器，支持大部分Sizzle支持的选择器，特意为Sizzle的支持作了适配。

## API

*  Simple.parseSelector(/*String*/selector)

    > 该方法用于解析选择器.

  * 下面的选择器将被解析为一个对象
      
          div.class1.class2.class3[type="text"]["data-type"="cc"]:nth-child(2n+1) 
      
            {
                   tagName: 'div',
                   id: '',
                   className: ['class1', 'class2', 'class3'],
                   attr: [{
                       name: 'type',
                       value: 'text'
                   }, {
                       name: 'data-type',
                       value: 'cc'
                   }],
                   pseudo: [{
                       name: 'nth-child',
                       index: '2n+1'
                   }]
            }
          
  * 下面的选择器被解析为一个数组
      
          div.class &gt; p 
      
          [{
                  tagName: 'p',
                  id: '',
                  className: [],
                  attr: [],
                  pseudo: []
          },{
                  tagName: 'div',
                  id: '',
                  className: ['class'],
                  attr: [],
                  pseudo: [],
                  separator: '&gt;'
          }]

*  Simple.query(/*String*/selector,/*HTMLElement*/context)

    > 该方法用于选择文档节点，返回节点数组
    
*  Simple.filter(/*HTMLElement|NodeList*/node,/*String*/selector)

    > 该方法用于从现有节点中再根据selector过滤文档节点，注意这里的node如果是数组则必须是经过Simple.query方法返回的nodeList，如果是单个节点则不存在此限制

*  Simple.query.implement(/*String*/name,/*Object*/prop)

    > 该方法用于扩展选择器的实现 
    
        Simple.query.implement('pseudo', {
          root:function(node){
                    return node.tagName.toLowerCase() === 'html';
          }
        });
        Simple.query(':root');

*  Simple.match(node,selector)

    > 该方法用于检测node是否符合selector，返回布尔值。
