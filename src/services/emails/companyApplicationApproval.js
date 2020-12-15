/* eslint-disable max-len */

module.exports = Object.freeze({
    NEW_COMPANY_APPLICATION_ADMINS: (email, companyName, motivation) => ({
        subject: `New company application pending review from ${companyName}`,
        text:
            `${companyName} <${email}> has requested to participate in NIJobs. Below is their motivation:
            \n
            \t${motivation}
            \n
            \n           
            To review and approve or reject this application, log in to NIJobs and go to the Applications Review page (https://ni.fe.up.pt/nijobs/review/applications).
            \n
            Sincerely,
            NIJobs team at NIAEFEUP
        `,
        html:
            `<h3>A company has requested access to NIJobs</h3>
            <br>
            <p>${companyName} <${email}> has requested to participate in NIJobs. Below is their motivation:</p>
            <blockquote><i>${motivation}</i></blockquote>
            <br>
            <br>
            <p>To review and approve or reject this application, log in to NIJobs and go to the <a href="https://ni.fe.up.pt/nijobs/review/applications">Applications Review</a> page.</p>
            <br>
            <p>Sincerely,</p>
            <p>NIJobs team at NIAEFEUP</p>
        `,
    }),
    NEW_COMPANY_APPLICATION_COMPANY: (companyName, applicationId) => ({
        subject: "Your NIJobs Application",
        text:
            `We have successfully received your application!
            \n
            We will now review your application, and in case you're approved, you will receive another email with further instructions in order to complete your registration. 
            \n
            Your Application ID is ${applicationId} and you registered ${companyName}
            \n
            If you did not request this or if you need anything else, don't hesitate to contact us!
            \n
            Sincerely,
            NIJobs team at NIAEFEUP
        `,
        html:
            `<h1>We have successfully received your application!</h1>
            <p>We will now review your application, and in case you're approved, you will receive another email with further instructions in order to complete your registration.</p>    
            <p>Your Application ID is ${applicationId} and you registered ${companyName}</p>
            <br>
            <p>If you did not request this or if you need anything else, don't hesitate to contact us!</p>
            <br>
            <p>Sincerely,</p>
            <p>NIJobs team at NIAEFEUP</p>
            
        `,
    }),
    APPROVAL_NOTIFICATION: (companyName) => ({
        subject: "Your NIJobs Application",
        text:
            `Glad to have you on board, ${companyName}!
            \n
            We decided to accept your application, and you are just one step away from being able to use NIJobs!  
            Now, you can log in to NIJobs (https://ni.fe.up.pt/nijobs) and complete your registration.
            Once you finish, you'll be able to place some work offers!
            \n
            If you need anything else, don't hesitate to contact us!
            \n
            Sincerely,
            NIJobs team at NIAEFEUP
        `,
        html:
            `<h1>Glad to have you on board, ${companyName}!</h1>
            <p>We decided to accept your application, and you are just one step away from being able to use NIJobs!</p>    
            <p>Now, you can log in to <a href="https://ni.fe.up.pt/nijobs">NIJobs</a> and complete your registration.
            Once you finish, you'll be able to place some work offers!</p>
            <br>
            <p>If you need anything else, don't hesitate to contact us!</p>
            <br>
            <p>Sincerely,</p>
            <p>NIJobs team at NIAEFEUP</p>
            
        `,
    })
});
