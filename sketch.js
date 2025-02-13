let classifier, video, label = "Model loading...", resultsListDiv, detectedCounts = {}, running = true, videoAspect = 1;

function preload() {
  classifier = ml5.imageClassifier("MobileNet");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, () => {
    video.elt.addEventListener("loadedmetadata", () => {
      videoAspect = video.elt.videoWidth / video.elt.videoHeight;
    });
  });
  video.hide();
  classifier.classifyStart(video, gotResult);
  
  resultsListDiv = createDiv("")
    .position(10, windowHeight + 20)
    .style("font-size", "16px")
    .style("color", "#000");
    
  let btn = createButton("CSV");
  btn.style("position", "absolute")
     .style("right", "20px")
     .style("top", "20px");
  btn.mousePressed(stopAndSave);
}

function draw() {
  if (video.elt.videoWidth) {
    let canvasAspect = windowWidth / windowHeight;
    if (canvasAspect > videoAspect) {
      let newH = windowWidth / videoAspect, yOff = (newH - windowHeight) / 2;
      image(video, 0, -yOff, windowWidth, newH);
    } else {
      let newW = windowHeight * videoAspect, xOff = (newW - windowWidth) / 2;
      image(video, -xOff, 0, newW, windowHeight);
    }
  } else {
    image(video, 0, 0, windowWidth, windowHeight);
  }
  fill(255);
  textSize(32);
  text(label, 20, 50);
}

function gotResult(results) {
  if (!running) return;
  if (results && results.length) {
    label = results[0].label;
    results.forEach(result => {
      const objLabel = result.label;
      const confStr = (result.confidence * 100).toFixed(2) + "%";
      if (detectedCounts[objLabel]) {
        detectedCounts[objLabel].count++;
        detectedCounts[objLabel].confidences.push(confStr);
        detectedCounts[objLabel].element.html(
          `${objLabel}: ${detectedCounts[objLabel].count} (Confidence ratings: ${detectedCounts[objLabel].confidences.join(", ")})`
        );
      } else {
        let p = createP(`${objLabel}: 1 (Confidence ratings: ${confStr})`);
        p.parent(resultsListDiv);
        detectedCounts[objLabel] = { count: 1, confidences: [confStr], element: p };
      }
    });
    reorderList();
  }
}

function reorderList() {
  let labels = Object.keys(detectedCounts).sort((a, b) => detectedCounts[b].count - detectedCounts[a].count);
  resultsListDiv.html("");
  labels.forEach(l => resultsListDiv.child(detectedCounts[l].element));
}

function stopAndSave() {
  running = false;
  let csvLines = ["label,count,confidences"];
  for (let key in detectedCounts) {
    csvLines.push(`${key},${detectedCounts[key].count},"${detectedCounts[key].confidences.join("; ")}"`);
  }
  saveStrings(csvLines, "objectDetection_confidence", "csv");
}
