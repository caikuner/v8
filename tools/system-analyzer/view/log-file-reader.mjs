// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {DOM, V8CustomElement} from './helper.mjs';

DOM.defineCustomElement('view/log-file-reader',
                        (templateText) =>
                            class LogFileReader extends V8CustomElement {
  constructor() {
    super(templateText);
    this.addEventListener('click', e => this.handleClick(e));
    this.addEventListener('dragover', e => this.handleDragOver(e));
    this.addEventListener('drop', e => this.handleChange(e));
    this.$('#file').addEventListener('change', e => this.handleChange(e));
    this.$('#fileReader')
        .addEventListener('keydown', e => this.handleKeyEvent(e));
  }

  set error(message) {
    this._updateLabel(message);
    this.root.className = 'fail';
  }

  _updateLabel(text) {
    this.$('#label').innerText = text;
  }

  handleKeyEvent(event) {
    if (event.key == 'Enter') this.handleClick(event);
  }

  handleClick(event) {
    this.$('#file').click();
  }

  handleChange(event) {
    // Used for drop and file change.
    event.preventDefault();
    this.dispatchEvent(
        new CustomEvent('fileuploadstart', {bubbles: true, composed: true}));
    const host = event.dataTransfer ? event.dataTransfer : event.target;
    this.readFile(host.files[0]);
  }

  handleDragOver(event) {
    event.preventDefault();
  }

  connectedCallback() {
    this.fileReader.focus();
  }

  get fileReader() {
    return this.$('#fileReader');
  }

  get root() {
    return this.$('#root');
  }

  async readFile(file) {
    if (!file) {
      this.error = 'Failed to load file.';
      return;
    }
    this.fileReader.blur();
    this.root.className = 'loading';

    const stream = file.stream().pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    let chunk, readerDone;
    do {
      const readResult = await reader.read();
      chunk = readResult.value;
      readerDone = readResult.done;
      if (!chunk) continue;

      this.dispatchEvent(new CustomEvent('fileuploadchunk', {
        bubbles: true,
        composed: true,
        detail: chunk,
      }));
    } while (!readerDone);

    this._updateLabel(`Finished loading '${file.name}'.`);
    this.dispatchEvent(
        new CustomEvent('fileuploadend', {bubbles: true, composed: true}));
    this.root.className = 'done';
  }
});
