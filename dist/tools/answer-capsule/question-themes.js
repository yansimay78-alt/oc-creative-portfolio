// Question forms are interpreted locally; this is not a prediction or an external AI call.
export function questionThemes(question = '') {
  const text = String(question).replace(/\s/g, '');
  const forms = [
    ['timing', /什么时候|啥时候|何时|多久|多长时间|来得及|晚不晚|太晚|时机|等几[天周月年]|何年|几时|哪天/],
    ['action', /怎么|如何|怎样|从哪里|从哪|有什么办法/],
    ['choice', /要不要|该不该|应不应该|是否应该|(?:该|应当).{0,12}[吗么]|值不值|选哪个|选哪|选谁|还是/],
    ['possibility', /能不能|会不会|可不可以|行不行|有没有可能|是否能|是否会|可能吗|[能会可].{0,12}[吗么]|是不是|成功|实现|顺利|有希望/],
    ['choice', /值得|选择|继续|放弃|放下|决定|取舍|后悔/],
  ];
  const primary = forms.find(([, pattern]) => pattern.test(text))?.[0];
  const relationship = /喜欢|爱我|感情|关系|相处|复合|分手|想我|朋友|恋爱|结婚|沟通|告白|表白|在乎|对方|我们|联系|在一起|家人/.test(text);
  return [...(primary ? [primary] : []), ...(relationship ? ['relationship'] : [])];
}
