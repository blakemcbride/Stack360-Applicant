
# Stack360 Job Applicant Front-end

This applicant front-end depends on the Stack360 back-end (which is
also released as open-source).	

It is designed as a web interface (not a native application) for
mobile devices.  While it also runs fine on a desktop or tablet, its
format is not as appealing.

Like the desktop interface, this interface, from the perspective of
the web server, is a separate web application independent of the other
Stack360 components.  

This interface communicates with the Stack360 back-end via
web services.  As such, when it is deployed, it must be modified
to point to the correct URL of the Stack360 back-end.  This is
done by modifying two files:

```
index.js	update the back-end URL
index.html	update softwareVersion and controlCache
```

The value of *softwareVersion* must be unique each time a change to
the system is made.  This assures that users of the system load the
new version and don't use a cached version.  In order for this
functionality to be enabled, *controlCache* must be set to *true*.

When you are ready to deploy, the script *makedist* can be used to
create a distribution.  When deploying it on the server, it should be
treated as a separate web application.






