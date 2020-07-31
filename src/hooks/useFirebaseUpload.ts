import { useState, useEffect } from "react";
import firebase from "firebase";

var firebaseConfig = {
  apiKey: "AIzaSyAc8j-lNvdsn9s0E7PfzuP4mAVEWo0jUQM",
  authDomain: "ywmobile4.firebaseapp.com",
  databaseURL: "https://ywmobile4.firebaseio.com",
  projectId: "ywmobile4",
  storageBucket: "ywmobile4.appspot.com",
  messagingSenderId: "97078231932",
  appId: "1:97078231932:web:1de62810a03a7e15b05af9",
  measurementId: "G-268ECD5SX3"};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// defining types...
type UploadDataResponse =
  | { metaData: firebase.storage.FullMetadata; downloadUrl: any }
  | undefined;
type ProgressResponse = { value: number } | undefined | null;
type DataAsDataUrl = { dataUrl: string; format: string };
type UploadSource = File | DataAsDataUrl | undefined;

// the firebase reference to storage
const storageRef = firebase.storage().ref();

function FirebaseFileUploadApi(): [
  {
    dataResponse: UploadDataResponse;
    isLoading: boolean;
    isError: any;
    progress: ProgressResponse;
  },
  Function,
  Function
] {
  // the data from the file upload response
  const [dataResponse, setDataResponse] = useState<UploadDataResponse>();

  // sets properties on the file to be uploaded
  const [fileData, setFileData] = useState<UploadSource>();

  // if we are loading a file or not
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // if an error happened during the process
  const [isError, setIsError] = useState<any>(false);

  // used for tracking the % of upload completed
  const [progress, setProgress] = useState<ProgressResponse>(null);

  const clearError = () => {
    setIsError(null);
  };

  // this function will be called when the any properties in the dependency array changes
  useEffect(() => {
    /**
     *
     * @param _value
     */
    const setUp = (_value: UploadSource): firebase.storage.UploadTask => {
      if (_value instanceof File || _value instanceof Blob) {
        console.log("processing as File");
        let fName = `${new Date().getTime()}`;

        if (_value instanceof Blob) {
          if (_value.type.split("/")[1] === "quicktime") {
            fName = fName + ".mov";
          } else {
            fName = fName + "." + _value.type.split("/")[1];
          }
        }

        // setting the firebase properties for the file upload
        let ref = storageRef.child("images/" + fName);
        return ref.put(_value);
      } else {
        console.log("processing as DataAsDataUrl");
        let v = _value as DataAsDataUrl;
        let fName = `${new Date().getTime()}.${v.format}`;
        // setting the firebase properties for the file upload
        let ref = storageRef.child("images/" + fName);
        return ref.putString(v.dataUrl, "data_url");
      }
    };

    const uploadData = async () => {
      // initialize upload information
      setIsError(false);
      setIsLoading(true);

      setProgress({ value: 0 });

      // handle a file upload or a dataUrl upload
      let uploadTask = setUp(fileData);

      // wrap the whole thing in a try catch block to update the error state
      try {
        // tracking the state of the upload to assist in updating the
        // application UI
        uploadTask.on(
          firebase.storage.TaskEvent.STATE_CHANGED,
          (_progress) => {
            var value = _progress.bytesTransferred / _progress.totalBytes;
            console.log("Upload is " + value * 100 + "% done");
            setProgress({ value });
          },
          (_error) => {
            setIsLoading(false);
            setIsError(_error);
          },
          async () => {
            setIsError(false);
            setIsLoading(false);

            // need to get the url to download the file
            let downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();

            // set the data when upload has completed
            setDataResponse({
              metaData: uploadTask.snapshot.metadata,
              downloadUrl,
            });

            // reset progress
            setProgress(null);
          }
        );
      } catch (_error) {
        setIsLoading(false);
        setIsError(_error);
      }
    };

    fileData && uploadData();
  }, [fileData]);

  return [
    { dataResponse, isLoading, isError, progress },
    setFileData,
    clearError,
  ];
}

export default FirebaseFileUploadApi;
