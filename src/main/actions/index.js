import firebase from '../../firebase';
// import config, { isDevelopment } from '../../firebase/configLoader';
import { UserRoles } from '../../utils';

const Actions = {
    LOAD_USER: 'LOAD_USER',
    USER_REDIRECT_SUCCESS: 'USER_REDIRECT_SUCCESS',

    LOG_IN_SUCCESS: 'LOG_IN_SUCCESS',
    USER_AUTHENTICATED: 'USER_AUTHENTICATED',
    LOG_OUT_SUCCESS: 'LOG_OUT_SUCCESS',
    // TODO: add actual fetching user's bookmarked subjects from backend
    SUBJECTS_SELECTED: 'SUBJECTS_SELECTED',

    CREATE_SUBJECT_SUCCESS: 'CREATE_SUBJECT_SUCCESS',
    CREATE_SUBJECT_FAIL: 'CREATE_SUBJECT_FAIL',
    LEAVE_CREATE_SUBJECT: 'LEAVE_CREATE_SUBJECT',

    LOAD_SUBJECT: 'LOAD_SUBJECT',
    LOAD_SUBJECT_SUCCESS: 'LOAD_SUBJECT_SUCCESS',
    LOADING_TABS: 'LOADING_TABS',
    LOAD_SUBJECT_HEAD: 'LOAD_SUBJECT_HEAD',
    LOAD_SUBJECT_HEAD_SUCCESS: 'LOAD_SUBJECT_HEAD_SUCCESS',
    SUBJECT_INSERT_HEAD: 'SUBJECT_INSERT_HEAD',
    SUBJECT_REMOVE_HEAD: 'SUBJECT_REMOVE_HEAD',
    SET_CURRENT_LECTURE: 'SET_CURRENT_LECTURE',

    SAVE_LECTURE_START: 'SAVE_LECTURE_START',
    SAVE_LECTURE_ERROR: 'SAVE_LECTURE_ERROR',
    SAVE_LECTURE_SUCCESS: 'SAVE_LECTURE_SUCCESS',
};

// When fetching the current user, keep track of which pathname she/he tried to access,
// in order to redirect her/him to that page after authentication
const loadUser = (userAccessedPathname) => {
    return (dispatch) => {
        dispatch({
            type: Actions.LOAD_USER,
            payload: userAccessedPathname,
        });
    };
};

const userRedirectedToAccessedPath = () => {
    return (dispatch) => {
        dispatch({
            type: Actions.USER_REDIRECT_SUCCESS,
        });
    };
};

const subscribeToAuthStateChanged = () => {
    return (dispatch) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // If the user has not confirmed his/her account yet, re-send a confirmation email
                // with a 'Continue' link, redirecting the user to the LaMaS web application
                // if (!user.emailVerified) {
                //     const redirectURI = isDevelopment() ? 'http://localhost:3000' : `https://${ config.default.authDomain }`;
                //
                //     user.sendEmailVerification({
                //         url: redirectURI,
                //     });
                // }

                firebase
                    .database()
                    .collection('user')
                    .doc(user.uid)
                    .get()
                    .then((snapshot) => {
                        const dbUser = {};
                        // default Student
                        if (snapshot.exists) {
                            dbUser.roles = snapshot.data().roles;
                        } else {
                            dbUser.roles = [UserRoles.STUDENT];
                        }

                        // merge auth and db user
                        const authUser = {
                            userCredentials: user,
                            ...dbUser,
                        };
                        dispatch({
                            type: Actions.LOG_IN_SUCCESS,
                            payload: authUser,
                        });
                    })
                    .catch((err) => {
                        console.log('error', err);
                    });
            } else {
                console.log('User logged out!');

                dispatch({
                    type: Actions.LOG_OUT_SUCCESS,
                });
            }
        });
    };
};

const logIn = (email, password) => {
    return (dispatch) => {
        // Connect to Firebase to perform a user login
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then((userCredentials) => {
                dispatch({
                    type: Actions.USER_AUTHENTICATED,
                    payload: userCredentials,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    };
};

const logOut = () => {
    return (dispatch) => {
        firebase
            .auth()
            .signOut()
            .then((res) => {
                dispatch({ type: Actions.LOG_OUT_SUCCESS });
            })
            .catch((err) => {
                console.log('ERROR ON LOGOUT ', err);
            });
    };
};

const createSubject = (submittedSubject, submittedTutors) => {
    return (dispatch) => {
        firebase
            .functions()
            .httpsCallable('addSubject')({
                subject_name: submittedSubject,
                assigned_tutors: submittedTutors,
            })
            .then((res) => {
                const data = {
                    subjectId: res.data.subjectId,
                    subject_name: submittedSubject,
                    assigned_tutors: submittedTutors.slice(),
                };

                dispatch({
                    type: Actions.CREATE_SUBJECT_SUCCESS,
                    payload: data,
                });
            })
            .catch((err) => {
                console.log('ERROR ON CREATE SUBJECT ', err);

                dispatch({
                    type: Actions.CREATE_SUBJECT_FAIL,
                });
            });
    };
};

const leaveCreateSubject = () => {
    return (dispatch) => {
        dispatch({
            type: Actions.LEAVE_CREATE_SUBJECT,
        });
    };
};

/**
 * Load the requested subject document.
 *
 * This action is called when a user clicks on a subject's link, requesting the subject's content.
 *
 * @param subject_id     The subject ID to be fetched from firestore
 * @returns {Function}
 */
const loadSubject = (subject_id) => {
    return (dispatch) => {
        return firebase
            .database()
            .collection('subjects')
            .doc(subject_id)
            .onSnapshot(function (doc) {
                if (doc.exists) {
                    const response = {
                        subject_id: doc.id,
                        subject: doc.data(),
                    };

                    dispatch({
                        type: Actions.LOAD_SUBJECT_SUCCESS,
                        payload: response,
                    });

                    return response;
                }
            });
    };
};

/**
 * Load all bookmarked subjects' links of the logged in user.
 *
 * This action is called on LandingPage to fire a request fetching all current user's bookmarked subjects' links.
 *
 * @returns {Function}
 */
const loadSubjectHead = () => {
    return (dispatch) => {
        // TODO: at the moment this request just fetch all subjects' names available on firestore!
        //       Later we will just fetch those subjects' names that the specific user (student (tutor too?)) has bookmarked!
        firebase
            .database()
            .collection('subjects')
            .onSnapshot(function (querySnapshot) {
                querySnapshot.docChanges().forEach(function (change) {
                    const response = {
                        name: change.doc.data().subject_name,
                        subject_id: change.doc.id,
                    };

                    if (change.type === 'added') {
                        dispatch({
                            type: Actions.SUBJECT_INSERT_HEAD,
                            payload: response,
                        });
                    }

                    if (change.type === 'removed') {
                        dispatch({
                            type: Actions.SUBJECT_REMOVE_HEAD,
                            payload: response,
                        });
                    }
                });
            });
    };
};

const selectLecture = (lectureNumber) => {
    return (dispatch) => {
        dispatch({
            type: Actions.SET_CURRENT_LECTURE,
            payload: lectureNumber,
        });
    };
};

const saveSubject = (subject) => {
    return (dispatch) => {
        dispatch({
            type: Actions.SAVE_LECTURE_START,
        });

        return firebase
            .database()
            .collection('subjects')
            .doc(subject.subject_id)
            .update(subject)
            .then(function () {
                dispatch({
                    type: Actions.SAVE_LECTURE_SUCCESS,
                });

                return { message: 'Subject successfully saved!' };
            })
            .catch(function (error) {
                dispatch({
                    type: Actions.SAVE_LECTURE_ERROR,
                    payload: error,
                });
                return error;
            });
    };
};

const fetchFile = (nameOnStorage) => {
    return () => {
        return firebase.storage()
                       .ref(nameOnStorage)
                       .getDownloadURL();
    };
};

export {
    Actions,
    loadUser,
    userRedirectedToAccessedPath,
    subscribeToAuthStateChanged,
    logIn,
    logOut,
    createSubject,
    leaveCreateSubject,
    loadSubject,
    loadSubjectHead,
    selectLecture,
    saveSubject,
    fetchFile,
};
