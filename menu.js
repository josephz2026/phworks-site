/* Shared menu behavior for every page: open/close with the Menu button,
   close when a link is tapped, when you tap anywhere else, or press Escape. */
(function(){
var b=document.querySelector('button.menu'),n=document.querySelector('header nav');
if(!b||!n)return;
function set(o){n.classList.toggle('open',o);b.setAttribute('aria-expanded',String(o))}
b.addEventListener('click',function(){set(!n.classList.contains('open'))});
n.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
document.addEventListener('pointerdown',function(e){
  if(n.classList.contains('open')&&!n.contains(e.target)&&!b.contains(e.target))set(false)
},true);
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&n.classList.contains('open')){set(false);b.focus()}
});
})();
