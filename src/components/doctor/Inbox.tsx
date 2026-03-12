import React, { useEffect, useState } from 'react';
import { Mail, Download } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  patient_name: string;
  patient_email: string;
  subject: string;
  body: string;
  created_at: string;
  has_attachment?: boolean;
  attachment_base64?: string;
}

const Inbox: React.FC = () => {
  const { currentDoctor } = useDoctorAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentDoctor) return;

    const doctorId = currentDoctor.id || currentDoctor._id;
    if (!doctorId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('doctor_messages')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [currentDoctor]);

  const handleReply = (email: string, subject: string) => {
    const mailto = `mailto:${email}?subject=${encodeURIComponent('Re: ' + subject)}`;
    window.location.href = mailto;
    toast({
      title: 'Opening mail client…',
      description: `Replying to ${email}`,
    });
  };

  const handleDownloadAttachment = async (base64Data: string, patientName: string) => {
    try {
      // Decode base64 to array buffer
      const res = await fetch(base64Data);
      const blob = await res.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health_report_${patientName.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast({
        title: 'Downloaded Attachment',
        description: `Saved PDF from ${patientName}`,
      });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not process the PDF attachment.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading messages...</p>;
  }

  if (messages.length === 0) {
    return <p className="text-muted-foreground text-sm">No messages.</p>;
  }

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> {msg.subject}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                From: {msg.patient_name} ({msg.patient_email}) • {new Date(msg.created_at).toLocaleDateString()}
              </p>
              <p className="whitespace-pre-line break-words text-sm">{msg.body}</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button size="sm" onClick={() => handleReply(msg.patient_email, msg.subject)}>
                Reply
              </Button>
              {msg.has_attachment && msg.attachment_base64 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownloadAttachment(msg.attachment_base64 as string, msg.patient_name)}
                >
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default Inbox;
