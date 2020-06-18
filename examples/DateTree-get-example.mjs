import Gun from 'gun';
import { DateTree } from '../dist/index.mjs';

let gun = Gun();
let treeRoot = gun.get('tree-get');
let tree = new DateTree(treeRoot, 'day');

let eventRef = treeRoot.get('2020').get('08').get('23');

eventRef.map().on((value, key) => {
    console.log(key + ': ' + value);
    // Output:
    // event: of a lifetime
});

tree.get('2020-08-23').put({ event: 'of a lifetime' });

(async () => {
    let event = await tree.get('2020-08-23').get('event').then();
    console.log('event: ' + event);
    // Output:
    // event: of a lifetime
})();

// Delete your radata folder (Gun's local storage) if you see unexpected logs
