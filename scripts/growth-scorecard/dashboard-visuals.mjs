// Presentation primitives only: every displayed value is supplied by the canonical model.
export const text=(content,{bold=false,color='default'}={})=>({type:'text',text:{content:String(content)},annotations:{bold,color}});
export const block=(type,content,style={})=>({object:'block',type,[type]:{rich_text:String(content)?[text(content,style)]:[]}});
export const caption=s=>block('paragraph',s,{color:'gray'});
export const title=(s,color='default')=>block('heading_2',s,{color});
export const smallTitle=(s,color='default')=>block('heading_3',s,{color});
export const divider=()=>({object:'block',type:'divider',divider:{}});
export const columns=groups=>({object:'block',type:'column_list',column_list:{children:groups.map(children=>({object:'block',type:'column',column:{children}}))}});
export const card=(name,children=[],color='gray_background',emoji='◻️')=>({object:'block',type:'callout',callout:{rich_text:[text(name,{bold:true})],icon:{type:'emoji',emoji},color,...(children.length?{children}:{})}});
// Bars are a rounded visual aid. Exact counts/rates always accompany them.
export function bar(ratio,width=24){
 if(!Number.isFinite(ratio)||ratio<0||ratio>1)return '—';
 const eighths=Math.round(ratio*width*8),whole=Math.floor(eighths/8),part=eighths%8;
 return '█'.repeat(whole)+(part?'▏▎▍▌▋▊▉'[part-1]:'')||(ratio>0?'▏':'');
}
export function reachBar(ratio,color='blue',width=24){return block('paragraph',bar(ratio,width),{color});}
export function splitBar(core,width=24){
 if(!Number.isFinite(core)||core<0||core>1)return caption('Coverage pending');
 const n=Math.round(core*width),items=[];
 if(n)items.push(text('█'.repeat(n),{color:'green'}));
 if(n<width)items.push(text('█'.repeat(width-n),{color:'gray'}));
 return {object:'block',type:'paragraph',paragraph:{rich_text:items}};
}
export const tile=(name,value,detail='',color='default')=>[card(name,[],'gray_background'),title(value,color),...(detail?[caption(detail)]:[])];
export const keyValue=(name,value,detail='')=>({object:'block',type:'paragraph',paragraph:{rich_text:[text(name+'  '),text(value,{bold:true}),...(detail?[text('  ·  '+detail,{color:'gray'})]:[])]}});
export const barCaption=(ratio,detail,color='blue')=>ratio===0?caption(detail):({object:'block',type:'paragraph',paragraph:{rich_text:[text(bar(ratio),{color}),text('\n'+detail,{color:'gray'})]}});
