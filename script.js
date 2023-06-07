class Enagramm {
  constructor() {
    this.text = '';
    this.punctuation = ['.', '!', '?', ';', ',', ' ']; // ordered by priority
    this.sentences = [];
    this.accessToken = '';

    this.isResultReceived = false;
    this.isLoggingEnagled = false;
    this.callback = null;
    this.finalResult = '';
  }

  get getIsResultReceived() {
    return this.isResultReceived;
  }

  set setIsResultReceived(audioFile) {
    this.isResultReceived = audioFile;
    if (this.isResultReceived && this.isLoggingEnagled) {
      this.callback(audioFile);
    }
  }

  onResult(_, callback) {
    this.isLoggingEnagled = true;
    this.callback = callback;
  }

  async getAccessToken() {
    try {
      const response = await fetch('https://enagramm.com/API/Account/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: 'levan.lashauri1@gmail.com',
          Password: 'Demo_1234',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.AccessToken;
      } else {
        throw new Error('Login failed with status ' + response.status);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async getAudioFilePath(model) {
    try {
      const response = await fetch(
        'https://enagramm.com/API/TTS/SynthesizeTextAudioPath',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: 'Bearer ' + this.accessToken,
          },
          body: JSON.stringify(model),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const sourceUrl = result.AudioFilePath;
        return sourceUrl;
      } else {
        throw new Error('Request failed with status ' + response.status);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async start() {
    await this.getAccessToken();

    while (this.text.length > 0) {
      // last sentence case or if the initial text is smaller than 150 characters
      if (this.text.length <= 150) {
        this.sentences.push(this.text);
        break;
      }

      const startIndex = 150;
      const endIndex = 230;

      let sentence = this.text.substring(0, startIndex);
      let substr = this.text.substring(startIndex, endIndex + 1);

      for (let i = 0; i < this.punctuation.length; i++) {
        if (substr.includes(this.punctuation[i])) {
          // get the position (indexOf) of the punctuation mark;
          // cut the subsrt at this position;
          // add the cut part to the sentence;
          // push to this.sentences;
          // remove the new sentence from this.text

          const substrEndIndex = substr.indexOf(this.punctuation[i]);
          substr = substr.substring(0, substrEndIndex + 1);
          sentence = sentence.concat(substr);
          this.sentences.push(sentence);
          this.text = this.text.substr(sentence.length);
          break;
        }
      }
    }

    for (let i = 0; i < this.sentences.length; i++) {
      const model = {
        Language: 'ka',
        Text: this.sentences[i],
        Voice: 0,
        IterationCount: 2,
      };

      this.setIsResultReceived = false;

      try {
        const audio = await this.getAudioFilePath(model);
        this.setIsResultReceived = audio;
      } catch (error) {
        console.error(error);
      }
    }
  }
}

const myText = new Enagramm();

myText.text = `კლასის აღწერა: Javascript კლასის შექმნა, რომელსაც ექნება text ველი, start() მეთოდი და onresult მოვლენა (event).
მუშაობის პრინციპი: მას შემდეგ რაც ამ კლასის მომხმარებელი შექმნის ამავე კლასის ობიექტს, text-ველს მიანიჭებს რაღაც ტექსტს და გამოიძახებს start() მეთოდს, ობიექტმა უნდა დაიწყოს მინიჭებული ტექსტის დაჭრა სასვენ ნიშნებზე/space-ზე შემეგი პრინციპით: თუ ტექსტის სიგრძე არის 150 სიმბოლოზე მეტი, მაშინ 150-ე და 230-ე სიმბოლოების შუალედში არსებულ სასვენ ნიშნებზე გაჭრას, შემდეგი პრიორიტეტით:
წერტილი, ძახილის ნიშანი, კითხვის ნიშანი, წერტილ-მძიმე, ძმიმე, space. ციკლი უნდა მიდიოდეს სანამ ტექსტი არ დამთავრდება, რომელიც შეიძლება იყოს ძალიან გრძელი მაგ: 1000000 სიმბოლოიანი.
ტექსტების მოჭრის შედეგად მიღებული ყოველი ნაწილი, მომდევნო მაგალითში აღნიშნული როგორც sentence, ასინქრონულად გააგზავნოს ბექში (სერვერის მხარეს) დასამუშავებლად შემდეგნაირად:
`;

myText.start();
myText.onResult('result', function (result) {
  this.finalResult = result;
  console.log('Audio file: ' + this.finalResult);
});
