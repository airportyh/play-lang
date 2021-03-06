import {
    renderText
} from "./term-utils.mjs";
import { ScrollableTextPane } from "./scrollable-text-pane.mjs";
import { isHeapRef } from "./language.mjs";
import { inspect } from "util";

export function HeapPane(db, box) {
    const self = {
        updateDisplay,
        get textPane() { return textPane }
    };
    
    const log = db.log;
    const cache = db.cache;
    const textPane = ScrollableTextPane(db, box);
    
    function updateDisplay() {
        const heap = db.snapshot.heapMap;
        // log.write(`Heap: ${inspect(heap)} \n`);
        const lines = [];
        for (let heapId in heap) {
            const id = heap[heapId];
            const object = cache.objectMap.get(id);
            //log.write(`Object(${heapId}): ${inspect(object)}\n`);
            if (Array.isArray(object)) {
                renderArray(heapId, object, lines);
            } else if (object instanceof Map) {
                renderDictionary(heapId, object, lines);
            } else if (typeof object === "string") {
                lines.push("*" + heapId);
                lines.push("  " + JSON.stringify(object));
            } else {
                
            }
        }
        
        // log.write(`Display lines: ${JSON.stringify(lines)}\n`);
        textPane.updateAllLines(lines);
        //renderText(box.left, box.top, box.width, box.height, lines);
    }
    
    function renderArray(id, array, lines) {
        const displayItems = array.map(displayValue);
        lines.push("*" + id);
        lines.push("┌" +
            displayItems.map(item => "".padEnd(item.length, "─")).join("┬") +
            "┐");
        if (displayItems.length > 0) {
            lines.push(
                "│" + displayItems.join("│") + "│");
        }
        lines.push(
            "└" + displayItems.map(item => "".padEnd(item.length, "─")).join("┴") +
             "┘");
    }
    
    function renderDictionary(id, dict, lines) {
        const entries = [];
        for (let [key, value] of dict.entries()) {
            entries.push([displayValue(key), displayValue(value)]);
        }
        const column1Width = entries.reduce((width, entry) =>
            entry[0].length > width ? entry[0].length : width, 1);
        const column2Width = entries.reduce((width, entry) =>
            entry[1].length > width ? entry[1].length : width, 1);
    
        lines.push("*" + id);
        lines.push(
            "┌" + Array(column1Width + 1).join("─") +
            "┬" + Array(column2Width + 1).join("─") +
            "┐");
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            lines.push(
                "│" + entry[0].padEnd(column1Width, " ") +
                "│" + entry[1].padEnd(column2Width, " ") +
                "│");
    
            if (i < entries.length - 1) {
                lines.push(
                    "├" + "".padEnd(column1Width, "─") +
                    "┼" + "".padEnd(column2Width, "─") +
                    "┤");
            }
        }
        lines.push(
            "└" + Array(column1Width + 1).join("─") +
            "┴" + Array(column2Width + 1).join("─") +
            "┘");
    }
    
    return self;
}

function displayValue(value) {
    if (value === null) {
        return "null";
    }else if (isHeapRef(value)) {
        return "*" + value.id;
    } else if (typeof value === "string") {
        return quote(value);
    } else {
        return String(value);
    }
}

function quote(str) {
    return '"' + str.replace(/\"/g, '\\"') + '"';
}
