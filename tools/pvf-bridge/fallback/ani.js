"use strict";

const DATA = {
  0: "LOOP", 1: "SHADOW", 3: "COORD", 7: "IMAGE RATE", 8: "IMAGE ROTATE",
  9: "RGBA", 10: "INTERPOLATION", 11: "GRAPHIC EFFECT", 12: "DELAY",
  13: "DAMAGE TYPE", 14: "DAMAGE BOX", 15: "ATTACK BOX", 16: "PLAY SOUND",
  17: "PRELOAD", 18: "SPECTRUM", 23: "SET FLAG", 24: "FLIP TYPE",
  25: "LOOP START", 26: "LOOP END", 27: "CLIP", 28: "OPERATION",
};
const EFFECT = ["NONE", "DODGE", "LINEARDODGE", "DARK", "XOR", "MONOCHROME", "SPACEDISTORT"];
const DAMAGE = ["NORMAL", "SUPERARMOR", "UNBREAKABLE"];
const FLIP = [undefined, "HORIZON", "VERTICAL", "ALL"];

function decompileBinaryAni(buffer) {
  try {
    let position = 0;
    const requireBytes = (count) => {
      if (position + count > buffer.length) throw new Error("Unexpected end of binary ANI.");
    };
    const u8 = () => { requireBytes(1); return buffer[position++]; };
    const u16 = () => { requireBytes(2); const value = buffer.readUInt16LE(position); position += 2; return value; };
    const i16 = () => { requireBytes(2); const value = buffer.readInt16LE(position); position += 2; return value; };
    const i32 = () => { requireBytes(4); const value = buffer.readInt32LE(position); position += 4; return value; };
    const f32 = () => { requireBytes(4); const value = buffer.readFloatLE(position); position += 4; return value.toFixed(2); };
    const ascii = (length) => { requireBytes(length); const value = buffer.subarray(position, position + length).toString("ascii"); position += length; return value; };
    const color = () => (256 + u8()) % 256;

    const frameCount = u16();
    const imageCount = u16();
    const images = [];
    for (let index = 0; index < imageCount; index += 1) images.push(ascii(i32()));

    const output = ["#PVF_File\r\n"];
    const append = (value) => output.push(value);
    const overallCount = u16();
    for (let index = 0; index < overallCount; index += 1) {
      const type = u16();
      if (type === 0 || type === 1) append(`[${DATA[type]}]\r\n\t${u8()}\r\n`);
      else if (type === 3 || type === 28) append(`[${DATA[type]}]\r\n\t${u16()}\r\n`);
      else if (type === 18) {
        append(`[SPECTRUM]\r\n\t${u8()}\r\n`);
        append(`\t[SPECTRUM TERM]\r\n\t\t${i32()}\r\n`);
        append(`\t[SPECTRUM LIFE TIME]\r\n\t\t${i32()}\r\n`);
        append(`\t[SPECTRUM COLOR]\r\n\t\t${color()}\t${color()}\t${color()}\t${color()}\r\n`);
        append(`\t[SPECTRUM EFFECT]\r\n\t\t\`${EFFECT[u16()] || "UNKNOWN"}\`\r\n`);
      } else return null;
    }

    append(`[FRAME MAX]\r\n\t${frameCount}\r\n`);
    for (let frame = 0; frame < frameCount; frame += 1) {
      append(`\r\n[FRAME${String(frame).padStart(3, "0")}]\r\n`);
      const boxCount = u16();
      let boxes = "";
      for (let index = 0; index < boxCount; index += 1) {
        const type = u16();
        if (type !== 14 && type !== 15) return null;
        boxes += `\t[${DATA[type]}]\r\n\t${i32()}\t${i32()}\t${i32()}\t${i32()}\t${i32()}\t${i32()}\r\n`;
      }

      append("\t[IMAGE]\r\n");
      const imageIndex = i16();
      if (imageIndex >= 0) {
        if (!images[imageIndex]) return null;
        append(`\t\t\`${images[imageIndex]}\`\r\n\t\t${u16()}\r\n`);
      } else append("\t\t``\r\n\t\t0\r\n");
      append(`\t[IMAGE POS]\r\n\t\t${i32()}\t${i32()}\r\n`);

      const itemCount = u16();
      for (let index = 0; index < itemCount; index += 1) {
        const type = u16();
        if ([0, 1, 10].includes(type)) append(`\t[${DATA[type]}]\r\n\t\t${u8()}\r\n`);
        else if (type === 3) append(`\t[COORD]\r\n\t\t${u16()}\r\n`);
        else if (type === 17) append("\t[PRELOAD]\r\n\t\t1\r\n");
        else if (type === 7) append(`\t[IMAGE RATE]\r\n\t\t${f32()}\t${f32()}\r\n`);
        else if (type === 8) append(`\t[IMAGE ROTATE]\r\n\t\t${f32()}\r\n`);
        else if (type === 9) append(`\t[RGBA]\r\n\t\t${color()}\t${color()}\t${color()}\t${color()}\r\n`);
        else if (type === 11) {
          const effect = u16();
          append(`\t[GRAPHIC EFFECT]\r\n\t\t\`${EFFECT[effect] || "UNKNOWN"}\`\r\n`);
          if (effect === 5) append(`\t\t${color()}\t${color()}\t${color()}\r\n`);
          if (effect === 6) append(`\t\t${i16()}\t${i16()}\r\n`);
        } else if (type === 12) append(`\t[DELAY]\r\n\t\t${i32()}\r\n`);
        else if (type === 13) append(`\t[DAMAGE TYPE]\r\n\t\t\`${DAMAGE[u16()] || "UNKNOWN"}\`\r\n`);
        else if (type === 16) append(`\t[PLAY SOUND]\r\n\t\t\`${ascii(i32())}\`\r\n`);
        else if (type === 23) append(`\t[SET FLAG]\r\n\t\t${i32()}\r\n`);
        else if (type === 24) append(`\t[FLIP TYPE]\r\n\t\t\`${FLIP[u16()] || "UNKNOWN"}\`\r\n`);
        else if (type === 25) append("\t[LOOP START]\r\n");
        else if (type === 26) append(`\t[LOOP END]\r\n\t\t${i32()}\r\n`);
        else if (type === 27) append(`\t[CLIP]\r\n\t\t${i16()}\t${i16()}\t${i16()}\t${i16()}\r\n`);
        else return null;
      }
      append(boxes);
    }
    return output.join("");
  } catch {
    return null;
  }
}

module.exports = { decompileBinaryAni };
