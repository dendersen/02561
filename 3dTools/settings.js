function makeSource(value, otherWise = Constant){
  if (value instanceof Source) {
    return value;
  }
  return new otherWise(value);
}

class Source{
  Get() {
    console.log("base called from source");
    throw new Error("Get method must be implemented by subclass.");
  }
  hasUpdate() {
    console.log("base called from source");
    throw new Error("hasUpdate method must be implemented by subclass.");
  }
  Generate() {
    console.log("base called from source");
    throw new Error("Generate method must be implemented by subclass.");
  }
  Delete() {}
}

class Constant extends Source {
  constructor(value){
    super();
    this.value = value;
  }
  Get() {
    return this.value;
  }
  hasUpdate() {
    return false;
  }
  Generate() {
    return this.value;
  }
}

class DocItem {
  constructor(source, name = undefined, description = undefined){
    this.source = source;
    this.name = name;
    this.description = description;

    const optionsDiv = document.getElementById("settings");

    if (!(source instanceof HTMLElement)) {
      throw new Error("Source must be an instance of HTMLElement.");
    }
    
    if (typeof(name) !== 'undefined') {
      this.name = document.createElement("label");
      this.name.textContent = name;
      optionsDiv.appendChild(this.name);
    }
    
    optionsDiv.appendChild(this.source);
    
    if (typeof(description) !== 'undefined') {
      const desc = document.createElement("p");
      desc.textContent = description;
      optionsDiv.appendChild(desc);
    }
    
    optionsDiv.appendChild(document.createElement("br"));
  }
  delete() {
    if (typeof(this.name) !== 'undefined') {
      this.name.parentNode.removeChild(this.name);
    }
    if (typeof(this.description) !== 'undefined') {
      this.description.parentNode.removeChild(this.description);
    }
    if (typeof(this.source) !== 'undefined') {
      this.source.parentNode.removeChild(this.source);
    }
  }
}

class Slider extends Source {
  constructor(start, end, init, step, isFloat = false, name = undefined, description = undefined){
    super();
    this.isFloat = isFloat;
    this.input = document.createElement("input");
    this.input.type = "range";
    this.input.min = start;
    this.input.max = end;
    this.input.value = init;
    this.input.step = step;
    this.updated = false;
    this.onChange = () => {this.updated = true;};
    this.input.addEventListener("input", () => {
      this.onChange();
    });
    this.doc = new DocItem(this.input, name, description);
  }
  Get() {
    return this.Generate();
  }
  hasUpdate() {
    return this.updated;
  }
  Generate() {
    return this.isFloat ? parseFloat(this.input.value) : parseInt(this.input.value);
  }
  Delete() {
    this.doc.delete();
  }
}

class DropDown extends Source {
  constructor(options, init, name = undefined, description = undefined){
    super();
    this.options = options;
    this.input = document.createElement("select");
    this.options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      this.input.appendChild(opt);
    });
    this.input.value = init;
    this.updated = false;
    this.onChange = () => {this.updated = true;};
    this.input.addEventListener("change", () => {
      this.onChange();
    });
    this.doc = new DocItem(this.input, name, description);
  }
  Get() {
    return this.Generate();
  }
  hasUpdate() {
    return this.updated;
  }
  Generate() {
    return this.input.value;
  }
  Delete() {
    this.doc.delete();
  }
}

class Number extends Source {
  constructor(value, isFloat = false, name = undefined, description = undefined){
    super();
    this.isFloat = isFloat;
    this.input = document.createElement("input");
    this.input.type = "number";
    this.input.value = value;
    this.updated = false;
    this.onChange = () => {this.updated = true;};
    this.input.addEventListener("input", () => {
      this.onChange();
    });
    this.doc = new DocItem(this.input, name, description);
  }
  Get() {
    return this.isFloat ? parseFloat(this.input.value) : parseInt(this.input.value);
  }
  hasUpdate() {
    return this.updated;
  }
  Generate() {
    return this.isFloat ? parseFloat(this.input.value) : parseInt(this.input.value);
  }
  Delete() {
    this.doc.delete();
  }
}

class vecSources extends Source {
  constructor(sources,vecFunc = undefined){
    super();
    this.sources = sources
    if (!Array.isArray(this.sources)) {
      this.sources = [this.sources];
    }
    for (let i = 0; i < this.sources.length; i++) {
      this.sources[i] = makeSource(this.sources[i]);
    }
    this.vecFunc = vecFunc;
  }
  Get() {
    let gets = this.sources.map(source => source.Get());
    if (typeof(this.vecFunc) !== 'undefined') {
      return this.vecFunc(gets);
    }
    return gets
  }
  hasUpdate() {
    return this.sources.some(source => source.hasUpdate());
  }
  Generate() {
    let generates = this.sources.map(source => source.Generate());
    if (typeof(this.vecFunc) !== 'undefined') {
      return this.vecFunc(generates);
    }
    return generates
  }
  Delete() {
    this.sources.forEach(source => source.Delete());
  }
}

class timeDependentSource extends Source {
  constructor(timeFunc, useDelta = false, inSeconds = false){
    super();
    this.timeFunc = timeFunc;
    this.useDelta = useDelta;
    this.inSeconds = inSeconds;
    this.lastCall = performance.now();
  }
  Get(){
    return this.Generate();
  }
  hasUpdate() {
    return true;
  }
  Generate() {
    const now = performance.now();
    let delta = now;
    if (this.useDelta) {
      delta = (now - this.lastCall) / (this.inSeconds ? 1000 : 1);
    }else{
      delta = now / (this.inSeconds ? 1000 : 1);
    }
    this.lastCall = now;
    return this.timeFunc(delta);
  }
}

class Projector extends Source{
  constructor(isPerspective, fov_left, aspect_right, near_bottom, far_top, _near = undefined, _far = undefined){
    super();
    if (isPerspective){
      this.fov = makeSource(fov_left);
      this.aspect = makeSource(aspect_right);
      this.near = makeSource(near_bottom);
      this.far = makeSource(far_top);
    }else{
      this.left = makeSource(fov_left);
      this.right = makeSource(aspect_right);
      this.bottom = makeSource(near_bottom);
      this.top = makeSource(far_top);
      this.near = makeSource(_near);
      this.far = makeSource(_far);
    }
    if (isPerspective.isVariable){
      if (typeof(this.near) !== 'undefined' || typeof(this.far) !== 'undefined') {
        throw new Error("Perspective projection should not have near or far defined.");
      }
    }
    this.isPerspective = isPerspective;
  }
  Get() {
    return this.Generate();
  }
  hasUpdate() {
    let updated = false;
    if (this.isPerspective) {
      updated |= this.fov.hasUpdate();
      updated |= this.aspect.hasUpdate();
      updated |= this.near.hasUpdate();
      updated |= this.far.hasUpdate();
    }else{
      updated |= this.left.hasUpdate();
      updated |= this.right.hasUpdate();
      updated |= this.bottom.hasUpdate();
      updated |= this.top.hasUpdate();
      updated |= this.near.hasUpdate();
      updated |= this.far.hasUpdate();
    }
    return updated;
  }
  Generate(){
    if(this.isPerspective){
      return perspective(this.fov.Get(), this.aspect.Get(), this.near.Get(), this.far.Get());
    } else {
      return ortho(this.left.Get(), this.right.Get(), this.bottom.Get(), this.top.Get(), this.near.Get(), this.far.Get());
    }
  }
}

class Camera extends Source{
  MVP_MATRIX = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
  )
  constructor(eyePos, viewDirection, viewRotation, projector){
    super();
    this.eyePos = makeSource(eyePos);
    this.viewDirection = makeSource(viewDirection);
    this.viewRotation = makeSource(viewRotation);
    this.projector = makeSource(projector);
    this.memory = undefined;
  }
  Get() {
    console.log("Camera Get called");
    if (typeof(this.memory) === 'undefined') {
      return this.Generate();
    }
    if(this.hasUpdate()) {
      return this.Generate();
    }
    return this.memory;
  }
  Generate() {
    console.log("Camera Generate called");
    const cameraEye = vec3(this.eyePos.Get());
    const cameraView = lookAt(
      cameraEye,
      add(cameraEye, vec3(this.viewDirection.Get())),
      vec3(this.viewRotation.Get())
    );
    const cameraProjection = this.projector.Generate();
    const cameraMvp = mult(
      this.MVP_MATRIX,
      mult(cameraProjection, cameraView)
    );
    this.memory = flatten(cameraMvp);
    return this.memory;
  }
  hasUpdate() {
    console.log("Camera hasUpdate called");
    return (
      this.eyePos.hasUpdate() ||
      this.viewDirection.hasUpdate() ||
      this.viewRotation.hasUpdate() ||
      this.projector.hasUpdate()
    );
  }
  update(device){
    if (this.hasUpdate()) {
      const cameraMvp = this.Generate();
      device.queue.writeBuffer(uniformBuffer, 0, cameraMvp);
    }
  }
  Delete(){
    this.eyePos.Delete()
    this.viewDirection.Delete()
    this.viewRotation.Delete()
    this.projector.Delete()
  }
}

class Texture extends Source{
  constructor(device, textureFrom, isBitmap){
    super();
    this.device = device;
    this.textureFrom = makeSource(textureFrom);
    this.isBitmap = makeSource(isBitmap);
    this.memory = undefined;
  }
  Get() {
    console.log("Texture Get called");
    if (typeof(this.memory) === 'undefined') {
      return this.Generate();
    }
    if (this.hasUpdate()) {
      return this.Generate();
    }
    return this.memory;
  }
  hasUpdate() {
    return (
      this.textureFrom.hasUpdate() ||
      this.isBitmap.hasUpdate()
    );
  }
  __bitmapFromPath(){
    fetch(this.imagePath.Get()).then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        return bitmap;
      });
    return null; // Return null if the bitmap is not yet available
  }
  Generate(){
    let bitmap = this.textureFrom.Get();
    let ownsBitmap = false;
    if (this.isBitmap.Get()) {
      const newBitmap = this.__bitmapFromPath();
      if (newBitmap !== null) {
        bitmap = newBitmap;
        ownsBitmap = true;
      }else{
        throw new Error("Failed to create bitmap from path");
      }
    }

    const mipLevelCount = Math.floor(Math.log2(Math.max(bitmap.width, bitmap.height))) + 1;
    const texture = this.device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      mipLevelCount: mipLevelCount,
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const mipCanvas = document.createElement("canvas");
    const mipContext = mipCanvas.getContext("2d");
    for (let mipLevel = 0; mipLevel < mipLevelCount; mipLevel++) {
      const width = Math.max(1, bitmap.width >> mipLevel);
      const height = Math.max(1, bitmap.height >> mipLevel);
      mipCanvas.width = width;
      mipCanvas.height = height;
      mipContext.drawImage(bitmap, 0, 0, width, height);
      this.device.queue.copyExternalImageToTexture(
        { source: mipCanvas, flipY: true },
        { texture: texture, mipLevel: mipLevel },
        [width, height, 1]
      );
    }
    if (ownsBitmap){
      bitmap.close();
    }
    this.memory = texture;
    return this.memory;
  }
  Delete(){
    this.textureFrom.Delete()
    this.isBitmap.Delete()
  }
}

class TextureView extends Source{
  constructor(device, texture){
    super();
    this.device = device;
    this.texture = makeSource(texture);
    this.memory = undefined;
  }
  Get() {
    if (typeof(this.memory) === 'undefined') {
      return this.Generate();
    }
    if (this.hasUpdate()) {
      return this.Generate();
    }
    return this.memory;
  }
  hasUpdate() {
    return this.texture.hasUpdate();
  }
  Generate() {
    this.memory = this.texture.Get();
    return this.memory;
  }
  Delete() {
    this.texture.Delete();
  }
}

class TextureSampler extends Source{
  constructor(device, addressModeU, addressModeV, magFilter, minFilter, mimpFilter, maxAnisotropy){
    super();
    this.device = device;
    this.addressModeU = makeSource(addressModeU);
    this.addressModeV = makeSource(addressModeV);
    this.magFilter = makeSource(magFilter);
    this.minFilter = makeSource(minFilter);
    this.mimpFilter = makeSource(mimpFilter);
    this.maxAnisotropy = makeSource(maxAnisotropy);
    this.memory = undefined;
  }
  Get() {
    console.log("TextureSampler Get called");
    if (typeof(this.memory) === 'undefined') {
      return this.Generate();
    }
    if (this.hasUpdate()) {
      return this.Generate();
    }
    return this.memory;
  }
  hasUpdate() {
    return (
      this.addressModeU.hasUpdate() ||
      this.addressModeV.hasUpdate() ||
      this.magFilter.hasUpdate() ||
      this.minFilter.hasUpdate() ||
      this.mimpFilter.hasUpdate() ||
      this.maxAnisotropy.hasUpdate()
    );
  }
  Generate() {
    this.memory = this.device.createSampler({
      addressModeU: this.addressModeU.Get(),
      addressModeV: this.addressModeV.Get(),
      magFilter: this.magFilter.Get(),
      minFilter: this.minFilter.Get(),
      mipmapFilter: this.mimpFilter.Get(),
      maxAnisotropy: this.maxAnisotropy.Get(),
    });
    return this.memory;
  }
  Delete() {
    this.addressModeU.Delete()
    this.addressModeV.Delete()
    this.magFilter.Delete()
    this.minFilter.Delete()
    this.mimpFilter.Delete()
    this.maxAnisotropy.Delete()
  }
}

class TextureBindGroup extends Source{
  constructor(device, buffer, textureSampler, textureView, pipeline){
    super();
    this.buffer = makeSource(buffer)
    this.textureSampler = makeSource(textureSampler)
    this.textureView = makeSource(textureView)
    this.pipeline = pipeline
    this.device = device
    this.memory = undefined
  }
  Get() {
    console.log("textureBindGroup Get called");
    if (typeof(this.memory) === 'undefined'){
      return this.Generate()
    }
    if (this.hasUpdate()){
      return this.Generate()
    }else{
      return this.memory
    }
  }
  hasUpdate() {
    return (
      this.buffer.hasUpdate() ||
      this.textureSampler.hasUpdate() ||
      this.textureView.hasUpdate()
    )
  }
  Generate() {
    let textureBindGroupLayout = this.pipeline.getBindGroupLayout(0);
    this.memory = this.device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffer.Get() },
        }, {
          binding: 1,
          resource: this.textureSampler.Get(),
        }, {
          binding: 2,
          resource: this.textureView.Get(),
        }
      ],
    });
    return this.memory;
  }
  Delete() {
    this.buffer.Delete()
    this.textureSampler.Delete()
    this.textureView.Delete()
  }
}