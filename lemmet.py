import nltk
nltk.download('wordnet')
nltk.download('punkt')

import sys

from nltk.stem.wordnet import WordNetLemmatizer
lmtzr = WordNetLemmatizer()

def lemmatizeSentence ():
    sentence = sys.argv[1]
    word_list = nltk.word_tokenize(sentence)
    lemmatized_output = ' '.join([lmtzr.lemmatize(w) for w in word_list])
    print(lemmatized_output)
    sys.stdout.flush()


lemmatizeSentence ()
