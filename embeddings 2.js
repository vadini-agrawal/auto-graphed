const tf = require('@tensorflow/tfjs-node');

require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

class Doc2Vec {
  constructor(embeddingDim, sequenceLength) {
    this.vocab = new Set();
    this.vocabSize = 3;  // Will be updated later based on data
    this.word2idx = {};
    this.idx2word = {};
    this.embeddingDim = embeddingDim;
    this.sequenceLength = sequenceLength;
    this.model = this.buildModel(); // To be re-initialized after vocab is built
  }

  buildModel() {
    const model = tf.sequential();
    model.add(tf.layers.embedding({
      inputDim: this.vocabSize,
      outputDim: this.embeddingDim,
      inputLength: this.sequenceLength
    }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: this.sequenceLength }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  }

  buildVocab(docs) {
    docs.forEach(doc => {
      doc.split(' ').forEach(word => this.vocab.add(word));
    });

    this.vocabSize = this.vocab.size;
    this.word2idx = {};
    this.idx2word = {};

    let idx = 0;
    this.vocab.forEach(word => {
      this.word2idx[word] = idx;
      this.idx2word[idx] = word;
      idx++;
    });

    // Re-initialize the model with the correct vocab size
    this.model = this.buildModel();
  }

  textToSequence(doc) {
    const words = doc.split(' ');
    const sequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      if (i < words.length) {
        sequence.push(this.word2idx[words[i]] || 0);
      } else {
        sequence.push(0);  // Padding
      }
    }
    return sequence;
  }

  async train(docs, epochs) {
    this.buildVocab(docs);
    const xTrain = docs.map(doc => this.textToSequence(doc));
    const yTrain = xTrain;  // Autoencoder kind of model for this example

    const xs = tf.tensor(xTrain);
    const ys = tf.tensor(yTrain);

    await this.model.fit(xs, ys, {
      epochs,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
        },
      },
    });
  }

  predict(doc) {
    const sequence = this.textToSequence(doc);
    const xs = tf.tensor([sequence]);
    const ys = this.model.predict(xs);
    return ys.dataSync();
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = tf.sum(tf.mul(vecA, vecB)).arraySync();
    const normA = tf.norm(vecA).arraySync();
    const normB = tf.norm(vecB).arraySync();
    return dotProduct / (normA * normB);
  }

  findMostSimilar(docs, threshold = 0.95) {
    const embeddings = docs.map(doc => this.predict(doc));
    const similarPairs = [];

    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        if (similarity > threshold) {
          similarPairs.push({
            docs: [docs[i], docs[j]],
            similarity
          });
        }
      }
    }

    return similarPairs;
  }
}


function cosineSimilarity(vecA, vecB) {
  const dotProduct = tf.sum(tf.mul(vecA, vecB)).arraySync();
  const normA = tf.norm(vecA).arraySync();
  const normB = tf.norm(vecB).arraySync();
  return dotProduct / (normA * normB);
}

async function findSimilarDocuments(docs, threshold = 0.8) {
  // Load Universal Sentence Encoder
  const model = await use.load();
  
  // Generate embeddings for each document
  const embeddings = await model.embed(docs);
  const similarPairs = [];
  
  // Compute cosine similarity
  for (let i = 0; i < docs.length; i++) {
    const vecA = embeddings.slice([i, 0], [1, embeddings.shape[1]]);
    for (let j = i + 1; j < docs.length; j++) {
      const vecB = embeddings.slice([j, 0], [1, embeddings.shape[1]]);
      const similarity = cosineSimilarity(vecA, vecB);
      if (similarity > threshold) {
        similarPairs.push({
          docs: [docs[i], docs[j]],
          similarity
        });
      }
    }
  }
  
  return similarPairs;
}

const docs = [
  'Enrico Fermi, one of the preeminent physicists of the 20th century, left an indelible imprint on the realm of nuclear physics. Widely recognized for his pivotal role in the development of the first nuclear reactor, Fermis contributions to both theoretical and experimental physics were monumental. He was honored with the Nobel Prize in Physics in 1938 for his significant work on induced radioactivity. As a cornerstone of the Manhattan Project, Fermis expertise was instrumental in unlocking the immense power of the atom. Today, his name resonates deeply in the annals of scientific history, with his achievements serving as foundational pillars for researchers worldwide.',
  'Lawrences contributions didnt stop at academic achievements; he played a central role in establishing the Lawrence Berkeley National Laboratory, a hub for innovation and research. Today, anyone delving into the annals of nuclear science or exploring the prestigious corridors of UC Berkeley will undoubtedly come across the influential legacy of Lawrence. He helped make the atomic bomb in the Manhattan project, working with Oppenheimer.',
  'Mattel is a toy company that created the very popular Barbie dolls',
];

(async () => {
  const threshold = 0.8;
  const similarPairs = await findSimilarDocuments(docs, 0.5);

  if (similarPairs.length > 0) {
    console.log("Similar document pairs:");
    similarPairs.forEach(pair => {
      console.log(`Docs: ${pair.docs[0]} & ${pair.docs[1]}`);
      console.log(`Similarity: ${pair.similarity}`);
    });
  } else {
    console.log("No similar document pairs found.");
  }
})();

// const embeddingDim = 8;
// const sequenceLength = 4;

// const doc2Vec = new Doc2Vec(embeddingDim, sequenceLength);

// (async () => {
//   await doc2Vec.train(docs, 100);

//   const testDoc = 'hello nice world';
//   const embedding = doc2Vec.predict(testDoc);
//   console.log(`Embedding for '${testDoc}': `, embedding);

//   console.log(doc2Vec.findMostSimilar(docs));
// })();
